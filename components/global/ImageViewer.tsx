'use client'

import type { Key } from '@heroui/react'
import type { ElementType, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { Button, ListBox, Modal, Select, Skeleton, Tooltip } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import NextImage from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowsDiagonalContract,
  ArrowsDiagonalMaximizeAlt,
  HorizontalMirror,
  RefreshRight,
  SpinLeft,
  SpinRight,
  VerticalMirror,
  ZoomIn,
  ZoomOut,
} from '~/components/icons'
import { usePopup } from '~/context/usePopupContext'
import { cn } from '~/lib/utils/tools'

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.1, 1.2, 1.3, 1.5, 2, 3, 4, 5] as const
// Step sizes for zoom interactions so adjustments feel gradual.
const BUTTON_ZOOM_STEP = 0.1
const WHEEL_ZOOM_STEP = 0.1
const KEYBOARD_ZOOM_STEP = 0.1
// Dampening factor applied to pinch gestures so tiny movements only adjust zoom slightly.
const PINCH_SENSITIVITY = 0.15

interface ToolbarButtonConfig {
  className?: string
  icon: ElementType
  key: string
  onPress: () => void
  tip: string
}

export interface ImageViewerProps {
  /**
   * A boolean flag indicating whether an element or component is currently visible.
   * When set to `true`, the element or component is displayed; when `false`, it is hidden.
   */
  visible?: boolean
  /**
   * A callback function that is triggered when a close event occurs.
   */
  onClose?: (state: boolean) => void
  /**
   * Image URL
   */
  src?: string
  /**
   * Array of images for multi-image browsing
   */
  images?: string[]
  /**
   * Current image index in the array
   */
  currentIndex?: number
  /**
   * Image change callback
   */
  onImageChange?: (index: number) => void
  /**
   * Whether to show thumbnails
   */
  showThumbnails?: boolean
  /**
   * Can the mask be closed by clicking?
   */
  externalClose?: boolean
  /**
   * Should keyboard navigation wrap around the image list.
   */
  loop?: boolean
  /**
   * Whether to display the image index counter.
   */
  showCounter?: boolean
  /**
   * Where the thumbnail rail should appear.
   */
  thumbnailPosition?: 'bottom' | 'right'
  /**
   * Initial zoom ratio applied when the viewer opens.
   */
  initialScale?: number
  /**
   * Minimum zoom ratio allowed.
   */
  minScale?: number
  /**
   * Maximum zoom ratio allowed.
   */
  maxScale?: number
}

function ImageViewerComponent(props: ImageViewerProps) {
  const {
    visible = false,
    onClose,
    src,
    images,
    currentIndex: initialIndex = 0,
    onImageChange,
    showThumbnails = true,
    externalClose = true,
    loop = true,
    showCounter = true,
    thumbnailPosition = 'bottom',
    initialScale: providedInitialScale = 1,
    minScale: providedMinScale = 0.2,
    maxScale: providedMaxScale = 5,
  } = props

  // Clamp provided bounds to protect against inverted props.
  const minScale = Math.min(providedMinScale, providedMaxScale)
  const maxScale = Math.max(minScale, providedMaxScale)

  // Build a normalized array of image URLs that we can render.
  const imagesToRender = useMemo(() => {
    if (Array.isArray(images) && images.length > 0) {
      return images.filter(Boolean)
    }
    if (src) {
      return [src]
    }
    return []
  }, [images, src])
  // Derive thumbnail metadata with stable keys for React lists.
  const thumbnailItems = useMemo(() => imagesToRender.map((image, index) => ({
    index,
    key: `${image}-${index}`,
    src: image,
  })), [imagesToRender])

  // Track overall gallery size for navigation controls.
  const totalImages = imagesToRender.length

  // Ensure the initial index is always within valid bounds.
  const normalizedInitialIndex = totalImages
    ? Math.min(Math.max(initialIndex ?? 0, 0), totalImages - 1)
    : 0

  // Respect the provided zoom range when computing the starting scale.
  const initialScale = Math.min(maxScale, Math.max(minScale, providedInitialScale))

  // Filter zoom presets so the dropdown only shows valid entries.
  const zoomPresets = useMemo(() => {
    const presetValues: number[] = ZOOM_PRESETS.filter(level => level >= minScale && level <= maxScale)
    if (!presetValues.includes(initialScale)) {
      presetValues.push(initialScale)
    }
    return Array.from(new Set(presetValues)).sort((a, b) => a - b)
  }, [initialScale, maxScale, minScale])

  // Track the active slide; controlled components bypass local state.
  const [internalIndex, setInternalIndex] = useState(normalizedInitialIndex)
  const isControlled = typeof props.currentIndex === 'number'
  // Resolve which slide should be displayed right now.
  const activeIndex = useMemo(() => {
    if (!totalImages) {
      return 0
    }
    const target = isControlled ? props.currentIndex ?? 0 : internalIndex
    return Math.min(Math.max(target, 0), totalImages - 1)
  }, [internalIndex, isControlled, props.currentIndex, totalImages])

  // Zoom ratio applied to the active image.
  const [scale, setScale] = useState(initialScale)

  // Compute which preset label should appear in the select input.
  const presetSelection = useMemo(() => {
    const match = zoomPresets.find(level => Math.abs(level - scale) < 0.05)
    return match != null ? match.toString() : 'custom'
  }, [scale, zoomPresets])

  // Rotation degrees for the canvas (0-359).
  const [rotation, setRotation] = useState(0)

  // Axis multipliers for horizontal/vertical mirroring.
  const [mirror, setMirror] = useState({ x: 1, y: 1 })

  // Translation offset that powers panning when zoomed.
  const [offset, setOffsetState] = useState({ x: 0, y: 0 })

  // Flag toggles dragging cursor + disables transitions for smoother feel.
  const [isDragging, setIsDragging] = useState(false)

  // Prevents transition effects while pinch-to-zoom is active.
  const [isPinching, setIsPinching] = useState(false)

  // Keeps track of Fullscreen API state for icon toggling.
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Cache for images that have already been loaded so skeletons disappear promptly.
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})

  // Reference to the interactive viewer container.
  const viewerRef = useRef<HTMLDivElement>(null)
  // Container for use with the Fullscreen API.
  const fullscreenRef = useRef<HTMLDivElement>(null)
  // Keeps current pointer locations for gestures.
  const pointerPositions = useRef<Map<number, { x: number, y: number }>>(new Map())
  // Stores the starting pinch distance/scale to compute zoom ratios.
  const pinchState = useRef<{ distance: number, scale: number } | null>(null)

  // Tracks drag information for both swipe navigation and panning.
  const dragState = useRef<{
    pointerId: number | null
    start: { x: number, y: number }
    origin: { x: number, y: number }
    startTime: number
  } | null>(null)

  // Stores metadata for backdrop taps so we can decide when to close.
  const tapState = useRef<{
    pointerId: number
    start: { x: number, y: number }
    startTime: number
    shouldRequestClose: boolean
  } | null>(null)

  // Reference to the rendered image for hit-testing.
  const imageRef = useRef<HTMLImageElement>(null)

  // Mirror critical motion state into refs for use inside gesture listeners.
  const scaleRef = useRef(scale)
  const offsetRef = useRef(offset)

  // Capture viewer DOM nodes so pointer events can query bounding boxes.
  const assignViewerRef = useCallback((node: HTMLDivElement | null) => {
    viewerRef.current = node
  }, [])

  // Helper to update both the ref + React state for panning offsets.
  const updateOffset = useCallback((value: { x: number, y: number }) => {
    offsetRef.current = value
    setOffsetState(value)
  }, [])

  // Keep refs synchronized any time the rendered scale changes.
  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  const isPointInsideImage = useCallback((clientX: number, clientY: number) => {
    // Snapshot the current transformed image bounds.
    const rect = imageRef.current?.getBoundingClientRect()
    if (!rect) {
      // Without a rendered image we treat the tap as outside.
      return false
    }
    // Check if the pointer sits between the left/right edges.
    const withinHorizontal = clientX >= rect.left && clientX <= rect.right
    // Check if the pointer sits between the top/bottom edges.
    const withinVertical = clientY >= rect.top && clientY <= rect.bottom
    // Only consider it inside when both axes match.
    return withinHorizontal && withinVertical
  }, [])

  // Constrain an arbitrary scale value to the allowed range.
  const clampScale = useCallback(
    (value: number) => Math.min(maxScale, Math.max(minScale, value)),
    [maxScale, minScale],
  )

  // Determine whether the user can pan at the current zoom level without snapping back.
  const canPersistPan = scale > 1

  // Reset all transforms when loading a new slide or hitting the reset button.
  const resetTransforms = useCallback(() => {
    scaleRef.current = initialScale
    setScale(initialScale)
    setRotation(0)
    setMirror({ x: 1, y: 1 })
    updateOffset({ x: 0, y: 0 })
    dragState.current = null
    setIsDragging(false)
  }, [initialScale, updateOffset])

  // Wrap or clamp incoming indexes based on the loop flag.
  const normalizeIndex = useCallback((index: number) => {
    if (!totalImages) {
      return 0
    }
    if (loop) {
      const normalized = index % totalImages
      return normalized < 0 ? normalized + totalImages : normalized
    }
    return Math.min(Math.max(index, 0), totalImages - 1)
  }, [loop, totalImages])

  // Centralized helper for moving to the next/prev slide safely.
  const applyIndexChange = useCallback((updater: (prev: number) => number) => {
    if (!totalImages) {
      return
    }
    if (isControlled) {
      const next = normalizeIndex(updater(activeIndex))
      if (next === activeIndex) {
        return
      }
      resetTransforms()
      onImageChange?.(next)
      return
    }
    setInternalIndex((prev) => {
      const next = normalizeIndex(updater(prev))
      if (next === prev) {
        return prev
      }
      resetTransforms()
      return next
    })
  }, [activeIndex, isControlled, normalizeIndex, onImageChange, resetTransforms, totalImages])

  useEffect(() => {
    if (!visible || !totalImages || isControlled) {
      return
    }
    onImageChange?.(activeIndex)
  }, [activeIndex, isControlled, onImageChange, totalImages, visible])

  useEffect(() => {
    if (!visible && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => undefined)
    }
  }, [visible])

  useEffect(() => {
    if (!visible) {
      return
    }

    const preventBrowserPinch = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault()
      }
    }
    window.addEventListener('wheel', preventBrowserPinch, { passive: false })

    return () => {
      window.removeEventListener('wheel', preventBrowserPinch)
    }
  }, [visible])

  useEffect(() => {
    if (!visible) {
      return
    }

    const preload = (index: number) => {
      if (!totalImages) {
        return
      }
      if (!loop && (index < 0 || index >= totalImages)) {
        return
      }
      const normalized = normalizeIndex(index)
      const url = imagesToRender[normalized]
      if (!url) {
        return
      }
      const img = new Image()
      img.src = url
    }
    preload(activeIndex + 1)
    preload(activeIndex - 1)
  }, [activeIndex, imagesToRender, loop, normalizeIndex, totalImages, visible])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const goToIndex = useCallback((index: number) => {
    applyIndexChange(() => index)
  }, [applyIndexChange])

  const goNext = useCallback(() => {
    applyIndexChange(prev => prev + 1)
  }, [applyIndexChange])

  const goPrev = useCallback(() => {
    applyIndexChange(prev => prev - 1)
  }, [applyIndexChange])

  const getImageCenterPoint = useCallback(() => {
    const rect = viewerRef.current?.getBoundingClientRect()
    if (!rect) {
      return null
    }
    return {
      x: rect.left + rect.width / 2 + offsetRef.current.x,
      y: rect.top + rect.height / 2 + offsetRef.current.y,
    }
  }, [])

  const updateZoomTarget = useCallback((prevScaleValue: number, nextScaleValue: number, point?: { x: number, y: number }) => {
    const shouldAutoContain = nextScaleValue <= 1
    if (shouldAutoContain) {
      if (offsetRef.current.x !== 0 || offsetRef.current.y !== 0) {
        updateOffset({ x: 0, y: 0 })
      }
      dragState.current = null
      setIsDragging(false)
      return
    }

    const rect = viewerRef.current?.getBoundingClientRect()

    if (!rect) {
      return
    }

    const prevOffset = offsetRef.current
    const ratio = prevScaleValue === 0 ? 1 : nextScaleValue / prevScaleValue

    const viewerCenterX = rect.left + rect.width / 2
    const viewerCenterY = rect.top + rect.height / 2
    const reference = point ?? {
      x: viewerCenterX + prevOffset.x,
      y: viewerCenterY + prevOffset.y,
    }
    const deltaX = reference.x - viewerCenterX - prevOffset.x
    const deltaY = reference.y - viewerCenterY - prevOffset.y
    const newOffset = {
      x: prevOffset.x + deltaX * (1 - ratio),
      y: prevOffset.y + deltaY * (1 - ratio),
    }

    updateOffset(newOffset)
  }, [updateOffset])

  const zoomTo = useCallback((target: number, point?: { x: number, y: number }) => {
    const prevScaleValue = scaleRef.current
    const nextScaleValue = clampScale(target)

    if (prevScaleValue === nextScaleValue) {
      return
    }

    updateZoomTarget(prevScaleValue, nextScaleValue, point)
    scaleRef.current = nextScaleValue
    setScale(nextScaleValue)
  }, [clampScale, updateZoomTarget])

  const zoomBy = useCallback((delta: number, point?: { x: number, y: number }) => {
    const prevScaleValue = scaleRef.current
    const nextScaleValue = clampScale(prevScaleValue + delta)

    if (prevScaleValue === nextScaleValue) {
      return
    }

    const referencePoint = point ?? getImageCenterPoint()

    updateZoomTarget(prevScaleValue, nextScaleValue, referencePoint ?? undefined)
    scaleRef.current = nextScaleValue
    setScale(nextScaleValue)
  }, [clampScale, getImageCenterPoint, updateZoomTarget])

  const handlePresetSelection = useCallback((incoming: Key | Key[] | null) => {
    const key = Array.isArray(incoming) ? incoming[0] : incoming
    if (!key || key === 'custom') {
      return
    }
    const numericValue = Number(key)
    if (!Number.isNaN(numericValue)) {
      zoomTo(numericValue)
    }
  }, [zoomTo])

  const toggleFullscreen = useCallback(() => {
    const node = fullscreenRef.current

    if (!node) {
      return
    }

    if (!document.fullscreenElement && node.requestFullscreen) {
      node.requestFullscreen().catch(() => undefined)
    }
    else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    if (!visible) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!visible) {
        return
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          goNext()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          goPrev()
          break
        case '+':
        case '=':
        case 'Add':
          event.preventDefault()
          zoomBy(KEYBOARD_ZOOM_STEP)
          break
        case '-':
        case '_':
        case 'Subtract':
          event.preventDefault()
          zoomBy(-KEYBOARD_ZOOM_STEP)
          break
        case ' ':
          event.preventDefault()
          toggleFullscreen()
          break
        case 'Escape':
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => undefined)
          }
          else {
            onClose?.(false)
          }
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [goNext, goPrev, onClose, toggleFullscreen, visible, zoomBy])

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const direction = event.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP
    zoomBy(direction, { x: event.clientX, y: event.clientY })
  }, [zoomBy])

  const beginPointerTracking = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!viewerRef.current) {
      return
    }
    if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1) {
      return
    }
    event.preventDefault()

    // Determine if this press landed within the current image bounds.
    const clickedInsideImage = isPointInsideImage(event.clientX, event.clientY)

    tapState.current = {
      // Remember which pointer initiated the tap.
      pointerId: event.pointerId,
      // Store tap origin to measure movement later.
      start: { x: event.clientX, y: event.clientY },
      // Track tap duration for distinguishing presses.
      startTime: performance.now(),
      // Only taps that started on the backdrop should close the viewer.
      shouldRequestClose: externalClose && event.target === event.currentTarget && !clickedInsideImage,
    }

    try {
      viewerRef.current.setPointerCapture(event.pointerId)
    }
    catch {
      // ignore capture errors
    }
    pointerPositions.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointerPositions.current.size === 1) {
      dragState.current = {
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        origin: { ...offset },
        startTime: performance.now(),
      }
      setIsDragging(true)
    }
    else {
      dragState.current = null
      setIsDragging(false)
    }
  }, [externalClose, isPointInsideImage, offset])

  const stopPointerTracking = useCallback((pointerId: number) => {
    pointerPositions.current.delete(pointerId)
    if (tapState.current?.pointerId === pointerId) {
      tapState.current = null
    }
    if (pointerPositions.current.size < 2) {
      pinchState.current = null
      setIsPinching(false)
    }
  }, [])

  const endPointerTracking = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!viewerRef.current) {
      return
    }
    try {
      viewerRef.current.releasePointerCapture(event.pointerId)
    }
    catch {
      // ignore release errors
    }
    const tapInfo = tapState.current?.pointerId === event.pointerId ? tapState.current : null
    if (tapInfo) {
      tapState.current = null
    }
    stopPointerTracking(event.pointerId)
    const drag = dragState.current
    const now = performance.now()
    if (drag && drag.pointerId === event.pointerId) {
      const deltaX = event.clientX - drag.start.x
      const deltaY = event.clientY - drag.start.y
      const duration = now - drag.startTime
      const distance = Math.hypot(deltaX, deltaY)
      dragState.current = null
      setIsDragging(false)

      const isShortTap = event.pointerType === 'touch' && distance < 12
      if (!isShortTap && Math.abs(deltaX) > 90 && Math.abs(deltaX) > Math.abs(deltaY) && scaleRef.current <= 1.2 && duration < 600) {
        if (deltaX < 0) {
          goNext()
        }
        else {
          goPrev()
        }
      }
    }

    if (
      // Only consider taps that began on the backdrop.
      tapInfo?.shouldRequestClose
      // Ignore while pinch zooming to avoid accidental closes.
      && !isPinching
    ) {
      // Horizontal travel distance of the tap.
      const tapDeltaX = event.clientX - tapInfo.start.x
      // Vertical travel distance of the tap.
      const tapDeltaY = event.clientY - tapInfo.start.y
      // Combined travel distance to gauge movement.
      const tapDistance = Math.hypot(tapDeltaX, tapDeltaY)
      // Total time between press and release.
      const tapDuration = now - tapInfo.startTime
      // Treat as tap only if there was barely any movement.
      const minimalMovement = tapDistance < 12
      // Treat as tap only if the press was brief.
      const quickInteraction = tapDuration < 400

      if (minimalMovement && quickInteraction) {
        // Trigger close for a quick backdrop tap.
        onClose?.(false)
      }
    }
    if (
      !canPersistPan
      && (offsetRef.current.x !== 0 || offsetRef.current.y !== 0)
    ) {
      updateOffset({ x: 0, y: 0 })
    }
  }, [canPersistPan, externalClose, goNext, goPrev, isPinching, onClose, stopPointerTracking, updateOffset, zoomTo])

  const updatePointerTracking = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!viewerRef.current) {
      return
    }
    if (!pointerPositions.current.has(event.pointerId)) {
      return
    }
    pointerPositions.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointerPositions.current.size >= 2) {
      dragState.current = null
      setIsDragging(false)
      const positions = Array.from(pointerPositions.current.values())
      const [first, second] = positions
      const distance = Math.hypot(second.x - first.x, second.y - first.y)
      const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
      if (!pinchState.current) {
        pinchState.current = { distance, scale: scaleRef.current }
      }
      else {
        setIsPinching(true)
        // Ratio of current pinch distance to the original gesture distance.
        const rawRatio = distance / pinchState.current.distance
        // Scale the delta down so light pinches only make subtle changes.
        const easedRatioChange = (rawRatio - 1) * PINCH_SENSITIVITY
        // Convert the dampened delta back into a multiplier.
        const adjustedRatio = 1 + easedRatioChange
        zoomTo(pinchState.current.scale * adjustedRatio, center)
        // Update the baseline so the next move compares against the latest state.
        pinchState.current = { distance, scale: scaleRef.current }
      }
      return
    }

    if (pinchState.current) {
      pinchState.current = null
      setIsPinching(false)
    }

    if (pointerPositions.current.size === 1 && !dragState.current) {
      dragState.current = {
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        origin: { ...offset },
        startTime: performance.now(),
      }
      setIsDragging(true)
    }

    const drag = dragState.current
    if (drag && drag.pointerId === event.pointerId) {
      const dx = event.clientX - drag.start.x
      const dy = event.clientY - drag.start.y
      updateOffset({
        x: drag.origin.x + dx,
        y: drag.origin.y + dy,
      })
    }
  }, [offset, updateOffset, zoomTo])

  const rotateBy = useCallback((delta: number) => {
    setRotation(prev => (prev + delta + 360) % 360)
  }, [])

  const toggleMirror = useCallback((axis: 'x' | 'y') => {
    setMirror(prev => ({
      ...prev,
      [axis]: prev[axis] === 1 ? -1 : 1,
    }))
  }, [])

  const toolbarButtons = useMemo<ToolbarButtonConfig[]>(() => [
    {
      icon: ZoomOut,
      key: 'zoom-out',
      tip: 'Zoom Out',
      onPress: () => zoomBy(-BUTTON_ZOOM_STEP),
    },
    {
      icon: ZoomIn,
      key: 'zoom-in',
      tip: 'Zoom In',
      onPress: () => zoomBy(BUTTON_ZOOM_STEP),
    },
    {
      icon: SpinLeft,
      key: 'rotate-ccw',
      tip: 'Rotate Counterclockwise',
      onPress: () => rotateBy(-90),
    },
    {
      className: 'rounded-full p-2 hover:bg-white/10',
      icon: SpinRight,
      key: 'rotate-cw',
      tip: 'Rotate Clockwise',
      onPress: () => rotateBy(90),
    },
    {
      icon: HorizontalMirror,
      key: 'mirror-x',
      tip: 'Mirror Horizontally',
      onPress: () => toggleMirror('x'),
    },
    {
      icon: VerticalMirror,
      key: 'mirror-y',
      tip: 'Mirror Vertically',
      onPress: () => toggleMirror('y'),
    },
    {
      icon: RefreshRight,
      key: 'reset',
      tip: 'Reset Transforms',
      onPress: resetTransforms,
    },
    {
      icon: isFullscreen ? ArrowsDiagonalContract : ArrowsDiagonalMaximizeAlt,
      key: 'fullscreen',
      tip: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
      onPress: toggleFullscreen,
    },
  ], [isFullscreen, resetTransforms, rotateBy, toggleFullscreen, toggleMirror, zoomBy])

  const [firstToolbarButton, ...remainingToolbarButtons] = toolbarButtons

  const renderToolbarButton = useCallback((button: ToolbarButtonConfig) => {
    const Icon = button.icon
    return (
      <Tooltip closeDelay={0} delay={0} key={button.key}>
        <Button
          className={button.className}
          isIconOnly
          onPress={button.onPress}
          type="button"
          variant="ghost"
        >
          <Icon className="size-4" />
        </Button>
        <Tooltip.Content>
          <span className="text-xs">{button.tip}</span>
        </Tooltip.Content>
      </Tooltip>
    )
  }, [])

  const showNavigation = totalImages > 1
  const thumbnailVertical = thumbnailPosition === 'right'
  const stopViewerPointer = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation()
  }, [])
  const stopWheelPropagation = useCallback((event: ReactWheelEvent<HTMLElement>) => {
    event.stopPropagation()
  }, [])

  const transformStyle = useMemo(() => {
    return {
      transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotation}deg) scale(${scale}) scaleX(${mirror.x}) scaleY(${mirror.y})`,
      transition: isPinching || isDragging ? 'none' : 'transform 200ms ease-out',
    }
  }, [isDragging, isPinching, mirror.x, mirror.y, offset.x, offset.y, rotation, scale])

  const imageClassName = 'select-none h-auto w-auto max-h-full max-w-full object-contain'
  const activeImage = totalImages ? imagesToRender[activeIndex] : null
  const canGoPrev = loop || activeIndex > 0
  const canGoNext = loop || activeIndex < totalImages - 1
  const isImageLoaded = activeImage ? Boolean(loadedImages[activeImage]) : false

  const handleImageLoad = useCallback(() => {
    if (!activeImage) {
      return
    }
    setLoadedImages((prev) => {
      if (prev[activeImage]) {
        return prev
      }
      return {
        ...prev,
        [activeImage]: true,
      }
    })
  }, [activeImage])

  return (
    <Modal isOpen={visible} onOpenChange={onClose}>
      <Modal.Backdrop isDismissable={externalClose} variant="blur">
        <Modal.Container className="p-0">
          <Modal.Dialog className="m-0 size-full max-h-screen max-w-screen bg-transparent p-0 rounded-none">
            {() => (
              <>
                {externalClose && (
                  <Modal.CloseTrigger className="absolute right-4 top-4 z-40 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition hover:bg-black/70" />
                )}
                <Modal.Body className="relative flex h-full w-full flex-col gap-4 p-0 shadow-none">
                  <div
                    className={cn(
                      'flex flex-1 overflow-hidden text-white backdrop-blur',
                      thumbnailVertical ? 'flex-row' : 'flex-col',
                    )}
                    ref={fullscreenRef}
                  >
                    <div className="relative flex-1 overflow-hidden">
                      <div
                        className="relative flex h-full w-full select-none items-center justify-center overflow-hidden"
                        onPointerCancel={endPointerTracking}
                        onPointerDown={beginPointerTracking}
                        onPointerLeave={endPointerTracking}
                        onPointerMove={updatePointerTracking}
                        onPointerUp={endPointerTracking}
                        onWheel={handleWheel}
                        ref={assignViewerRef}
                        role="presentation"
                        style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
                      >
                        {activeImage
                          ? (
                              <>
                                {!isImageLoaded && (
                                  <Skeleton
                                    animationType="pulse"
                                    aria-label="Image loading..."
                                    className="pointer-events-none absolute inset-0 h-full w-full rounded-3xl"
                                  />
                                )}
                                <AnimatePresence initial={false} mode="wait">
                                  <motion.div
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="pointer-events-none flex h-full w-full items-center justify-center"
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    initial={{ opacity: 0.2, scale: 0.95 }}
                                    key={`${activeIndex}-${activeImage}`}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <img
                                      alt="Preview"
                                      className={imageClassName}
                                      draggable={false}
                                      loading="lazy"
                                      onError={handleImageLoad}
                                      onLoad={handleImageLoad}
                                      ref={imageRef}
                                      src={activeImage}
                                      style={transformStyle}
                                    />
                                  </motion.div>
                                </AnimatePresence>
                              </>
                            )
                          : (
                              <div className="text-sm text-zinc-200">No image available</div>
                            )}

                        {showNavigation && (
                          <>
                            <Button
                              className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full"
                              isDisabled={!canGoPrev}
                              isIconOnly
                              onPointerDown={stopViewerPointer}
                              onPress={goPrev}
                              type="button"
                              variant="tertiary"
                            >
                              <ArrowLeft className="size-5 text-foreground" />
                            </Button>
                            <Button
                              className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full"
                              isDisabled={!canGoNext}
                              isIconOnly
                              onPointerDown={stopViewerPointer}
                              onPress={goNext}
                              type="button"
                              variant="tertiary"
                            >
                              <ArrowRight className="size-5 text-foreground" />
                            </Button>
                          </>
                        )}

                        {showCounter && totalImages > 0 && (
                          <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 text-xs font-medium text-white">
                            {activeIndex + 1}
                            {' / '}
                            {totalImages}
                          </div>
                        )}

                        <div
                          className="pointer-events-auto absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full bg-background/60 px-4 py-2 shadow-lg backdrop-blur"
                          onPointerDown={stopViewerPointer}
                          onWheel={stopWheelPropagation}
                        >
                          {firstToolbarButton ? renderToolbarButton(firstToolbarButton) : null}
                          <span className="text-xs tabular-nums">
                            {(scale * 100).toFixed(0)}
                            %
                          </span>
                          <Select
                            aria-label="缩放预设"
                            className="min-w-24 text-xs"
                            onChange={handlePresetSelection}
                            value={presetSelection}
                          >
                            <Select.Trigger className="flex items-center gap-1 rounded-full px-2 py-1 text-xs outline-none bg-transparent border border-separator/30 dark:border-separator">
                              <Select.Value className="text-xs">
                                {({ selectedText }) => selectedText || '缩放预设'}
                              </Select.Value>
                              <Select.Indicator className="h-3 w-3" />
                            </Select.Trigger>
                            <Select.Popover
                              className="rounded-2xl border shadow-lg backdrop-blur"
                              onPointerDown={stopViewerPointer}
                              onWheel={stopWheelPropagation}
                            >
                              <ListBox
                                aria-label="缩放预设选项"
                                className="max-h-60 min-w-32 gap-1 p-1 text-sm"
                              >
                                <ListBox.Item id="custom" key="custom" textValue="自定义">
                                  <span>自定义</span>
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                                {zoomPresets.map((level) => {
                                  const key = level.toString()
                                  const label = `${(level * 100).toFixed(0)}%`
                                  return (
                                    <ListBox.Item id={key} key={key} textValue={label}>
                                      <span>{label}</span>
                                      <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                  )
                                })}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                          {remainingToolbarButtons.map(renderToolbarButton)}
                        </div>
                      </div>

                      <div
                        className="pointer-events-auto z-20 flex flex-col gap-1 px-4 pb-6 pt-3 text-xs text-white sm:flex-row sm:items-center sm:justify-between"
                        onPointerDown={stopViewerPointer}
                        onWheel={stopWheelPropagation}
                      >
                        <label className="flex items-center gap-2">
                          <span className="hidden sm:inline">Rotation</span>
                          <input
                            aria-label="Rotation"
                            className="h-1 w-40 cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
                            max={180}
                            min={-180}
                            onChange={event => setRotation(Number(event.target.value))}
                            step={1}
                            type="range"
                            value={rotation > 180 ? rotation - 360 : rotation}
                          />
                          <span>
                            {Math.round(rotation)}
                            °
                          </span>
                        </label>

                        <span className="text-[0.7rem] text-white/70">双指缩放 • 拖拽平移</span>
                      </div>
                    </div>

                    {showThumbnails && totalImages > 1 && (
                      <div
                        className={cn(
                          'rounded-2xl bg-background/10 backdrop-blur-sm p-3 shadow-xl',
                          thumbnailVertical ? 'w-32 overflow-y-auto' : 'h-32 overflow-x-auto',
                        )}
                        onPointerDown={stopViewerPointer}
                        onWheel={stopWheelPropagation}
                      >
                        <div
                          className={cn(
                            'flex gap-3 h-full',
                            thumbnailVertical ? 'flex-col' : 'flex-row',
                          )}
                        >
                          {thumbnailItems.map(thumbnail => (
                            <Button
                              className={cn(
                                'overflow-hidden rounded-xl border-2 transition hover:border-white/70 size-24 p-0',
                                activeIndex === thumbnail.index ? 'border-accent shadow-lg' : 'border-transparent opacity-70',
                              )}
                              key={thumbnail.key}
                              onClick={() => goToIndex(thumbnail.index)}
                              type="button"
                              variant="ghost"
                            >
                              <NextImage
                                alt={`Thumbnail ${thumbnail.index + 1}`}
                                className="size-full object-cover"
                                height={100}
                                loading="lazy"
                                src={thumbnail.src}
                                width={100}
                              />
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Modal.Body>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export function ImageViewer() {
  const { popups, hidePopup } = usePopup()
  const { visible, isClosing, params, callbacks } = popups.ImageViewer

  const handleClose = useCallback(async (_state: boolean) => {
    await Promise.resolve(callbacks.beforeClose?.()).catch(console.error)
    hidePopup('ImageViewer')
  }, [hidePopup, callbacks])

  const isMounted = visible || isClosing

  if (!isMounted) {
    return null
  }

  return (
    <ImageViewerComponent
      {...params}
      onClose={handleClose}
      visible={visible}
    />
  )
}

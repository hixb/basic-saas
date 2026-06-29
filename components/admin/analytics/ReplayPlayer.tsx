'use client'

import { Button, Tooltip } from '@heroui/react'
import { Maximize2, Minimize2, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'
import { cn } from '~/lib/utils/tools'
import 'rrweb/dist/style.css'

const RRWEB_EVENT_TYPE_META = 4
const RRWEB_EVENT_TYPE_FULL_SNAPSHOT = 2
const FALLBACK_REPLAY_WIDTH = 960
const FALLBACK_REPLAY_HEIGHT = 560
const SPEED_OPTIONS = [0.5, 1, 2, 4]
const MIN_PLAYER_RATIO = 16 / 9
const MAX_PLAYER_RATIO = 21 / 9

interface ReplayerInstance {
  wrapper: HTMLDivElement
  iframe: HTMLIFrameElement
  destroy: () => void
  getCurrentTime: () => number
  getMetaData: () => { totalTime: number }
  on: (event: string, handler: () => void) => ReplayerInstance
  pause: (timeOffset?: number) => void
  play: (timeOffset?: number) => void
  setConfig: (config: { speed?: number, mouseTail?: false }) => void
}

interface ReplayDimension {
  height: number
  width: number
}

function hasPlayableSnapshot(events: any[]) {
  return events.some(event => event?.type === RRWEB_EVENT_TYPE_META)
    && events.some(event => event?.type === RRWEB_EVENT_TYPE_FULL_SNAPSHOT)
}

function sortReplayEvents(events: any[]) {
  return [...events].sort((a, b) => {
    const left = typeof a?.timestamp === 'number' ? a.timestamp : 0
    const right = typeof b?.timestamp === 'number' ? b.timestamp : 0
    return left - right
  })
}

function getReplayDimension(events: any[]): ReplayDimension {
  const meta = events.find(event => event?.type === RRWEB_EVENT_TYPE_META)
  const width = typeof meta?.data?.width === 'number' ? meta.data.width : FALLBACK_REPLAY_WIDTH
  const height = typeof meta?.data?.height === 'number' ? meta.data.height : FALLBACK_REPLAY_HEIGHT

  return {
    height: Math.max(320, height),
    width: Math.max(320, width),
  }
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function callReplayer(callback: (() => void) | undefined) {
  try {
    callback?.()
  }
  catch {
  }
}

interface ReplayPlayerProps {
  events: any[]
  onClose?: () => void
  subtitle?: string
  title?: string
}

export function ReplayPlayer({ events, onClose, subtitle, title }: ReplayPlayerProps) {
  const t = useTypedTranslations('common')
  const frameRef = useRef<HTMLDivElement>(null)
  const replayerRef = useRef<ReplayerInstance | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const playable = hasPlayableSnapshot(events)
  const sortedEvents = useMemo(() => sortReplayEvents(events), [events])
  const dimension = useMemo(() => getReplayDimension(sortedEvents), [sortedEvents])
  const replayRatio = dimension.width / dimension.height
  const playerRatio = Math.min(Math.max(replayRatio, MIN_PLAYER_RATIO), MAX_PLAYER_RATIO)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isChromeVisible, setIsChromeVisible] = useState(true)
  const [speed, setSpeed] = useState(1)

  const resizePlayer = useCallback(() => {
    const frame = frameRef.current
    const replayer = replayerRef.current

    if (!frame || !replayer)
      return

    const widthScale = frame.clientWidth / dimension.width
    const heightScale = frame.clientHeight / dimension.height
    const scale = Math.min(widthScale, heightScale)
    const renderedWidth = dimension.width * scale
    const renderedHeight = dimension.height * scale

    replayer.wrapper.style.left = `${Math.max(0, (frame.clientWidth - renderedWidth) / 2)}px`
    replayer.wrapper.style.top = `${Math.max(0, (frame.clientHeight - renderedHeight) / 2)}px`
    replayer.wrapper.style.transform = `scale(${scale})`
    replayer.wrapper.style.transformOrigin = 'top left'
  }, [dimension.height, dimension.width])

  function playFrom(timeOffset = currentTime) {
    const replayer = replayerRef.current

    if (!replayer)
      return

    const isAtEnd = duration > 0 && timeOffset >= duration - 50
    const nextTime = isAtEnd ? 0 : Math.min(timeOffset, duration)

    replayer.play(nextTime)
    setCurrentTime(nextTime)
    setIsPlaying(true)
  }

  function pauseAt(timeOffset = currentTime) {
    const replayer = replayerRef.current

    if (!replayer)
      return

    replayer.pause(Math.min(timeOffset, duration))
    setCurrentTime(Math.min(timeOffset, duration))
    setIsPlaying(false)
  }

  function seekTo(timeOffset: number, shouldPlay = isPlaying) {
    const nextTime = Math.min(Math.max(timeOffset, 0), duration)

    if (shouldPlay)
      playFrom(nextTime)
    else
      pauseAt(nextTime)

    setCurrentTime(nextTime)
  }

  function showChrome() {
    setIsChromeVisible(true)
  }

  function hideChrome() {
    if (!isPlaying)
      return

    setIsChromeVisible(false)
  }

  function handleSpeedChange(nextSpeed: number) {
    setSpeed(nextSpeed)
    replayerRef.current?.setConfig({ speed: nextSpeed })
  }

  async function toggleFullscreen() {
    const shell = shellRef.current

    if (!shell)
      return

    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await shell.requestFullscreen()
  }

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(document.fullscreenElement === shellRef.current)
      window.setTimeout(resizePlayer, 80)
    }

    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [resizePlayer])

  useEffect(() => {
    if (!stageRef.current || !events.length || !playable)
      return

    let disposed = false
    let progressTimer = 0
    let resizeObserver: ResizeObserver | null = null
    const stage = stageRef.current
    stage.innerHTML = ''

    async function mountReplayer() {
      const rrwebModule = await import('rrweb')

      if (disposed)
        return

      const replayer = new rrwebModule.Replayer(sortedEvents, {
        mouseTail: false,
        root: stage,
        showWarning: true,
        skipInactive: false,
        speed,
      }) as ReplayerInstance

      replayerRef.current = replayer
      replayer.setConfig({ mouseTail: false })
      setDuration(replayer.getMetaData().totalTime)
      setCurrentTime(0)
      setIsPlaying(false)
      replayer.pause(0)
      resizePlayer()
      window.setTimeout(resizePlayer, 80)
      window.requestAnimationFrame(resizePlayer)
      replayer.on('finish', () => {
        setIsPlaying(false)
        setCurrentTime(replayer.getMetaData().totalTime)
      })

      progressTimer = window.setInterval(() => {
        const nextTime = replayer.getCurrentTime()
        setCurrentTime(Math.min(nextTime, replayer.getMetaData().totalTime))
      }, 200)

      if (frameRef.current) {
        resizeObserver = new ResizeObserver(resizePlayer)
        resizeObserver.observe(frameRef.current)
      }
    }

    void mountReplayer()
    window.addEventListener('resize', resizePlayer)

    return () => {
      disposed = true
      window.clearInterval(progressTimer)
      window.removeEventListener('resize', resizePlayer)
      resizeObserver?.disconnect()
      callReplayer(() => replayerRef.current?.destroy())
      replayerRef.current = null
      stage.innerHTML = ''
    }
  }, [events, playable, resizePlayer, sortedEvents])

  useEffect(() => {
    replayerRef.current?.setConfig({ speed })
  }, [speed])

  if (!events.length) {
    return (
      <div className="flex min-h-90 items-center justify-center rounded-lg bg-surface-secondary text-sm text-muted">
        {t('admin.analytics.replay.empty')}
      </div>
    )
  }

  if (!playable) {
    return (
      <div className="flex min-h-90 items-center justify-center rounded-lg bg-surface-secondary px-6 text-center text-sm text-muted">
        {t('admin.analytics.replay.missingSnapshot')}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-full overflow-hidden bg-black',
        isFullscreen && 'h-screen min-h-screen rounded-none border-none',
      )}
      onBlur={hideChrome}
      onFocus={showChrome}
      onMouseEnter={showChrome}
      onMouseLeave={hideChrome}
      ref={shellRef}
    >
      <div
        className={cn('relative mx-auto bg-black', isFullscreen ? 'max-h-screen' : 'max-h-[calc(92vh-4rem)]')}
        style={{
          aspectRatio: `${playerRatio}`,
          width: isFullscreen
            ? `min(100vw, calc(100vh * ${playerRatio}))`
            : `min(100%, calc((92vh - 4rem) * ${playerRatio}))`,
        }}
      >
        <div
          className={cn(
            'absolute inset-0 overflow-hidden bg-black',
          )}
          ref={frameRef}
        >
          <div
            className="absolute left-0 top-0"
            ref={stageRef}
            style={{
              height: dimension.height,
              width: dimension.width,
            }}
          />
        </div>

        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 z-20 bg-linear-to-b from-black/75 via-black/35 to-transparent px-4 pb-10 pt-4 text-white transition-opacity duration-200 sm:px-5',
            isChromeVisible ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="min-w-0 pr-12">
            <h2 className="text-base font-semibold text-white">{title ?? t('admin.analytics.replay.title')}</h2>
            {subtitle && <p className="mt-0.5 max-w-[78vw] truncate text-xs text-white/70">{subtitle}</p>}
          </div>
        </div>

        {onClose && (
          <Button
            className={cn(
              'absolute right-4 top-4 z-30 size-8 bg-white/10 text-white transition-opacity duration-200 hover:bg-white/15',
              isChromeVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            isIconOnly
            onPress={onClose}
            size="sm"
            variant="ghost"
          >
            <span className="text-xl leading-none">×</span>
          </Button>
        )}

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/85 via-black/35 to-transparent px-3 pb-3 pt-14 text-white transition-opacity duration-200 sm:px-5 sm:pb-5',
            isChromeVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 sm:grid-cols-[3.5rem_1fr_3.5rem] sm:gap-3">
            <span className="text-right text-xs font-medium tabular-nums text-white/85">{formatTime(currentTime)}</span>
            <input
              aria-label={t('admin.analytics.replay.progress')}
              className="h-1 min-w-0 flex-1 cursor-pointer accent-white sm:h-1.5"
              max={duration || 1}
              min={0}
              onChange={event => seekTo(Number(event.currentTarget.value), false)}
              type="range"
              value={Math.min(currentTime, duration || 1)}
            />
            <span className="text-xs font-medium tabular-nums text-white/85">{formatTime(duration)}</span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1">
              <Tooltip delay={0}>
                <Button className="size-9 bg-white/10 text-white hover:bg-white/15" isIconOnly onPress={() => seekTo(0, false)} size="sm" variant="ghost">
                  <RotateCcw className="size-4" />
                </Button>
                <Tooltip.Content>{t('admin.analytics.replay.restart')}</Tooltip.Content>
              </Tooltip>
              <Tooltip delay={0}>
                <Button className="size-9 bg-white/10 text-white hover:bg-white/15" isIconOnly onPress={() => seekTo(currentTime - 5000)} size="sm" variant="ghost">
                  <SkipBack className="size-4" />
                </Button>
                <Tooltip.Content>{t('admin.analytics.replay.back')}</Tooltip.Content>
              </Tooltip>
              <Tooltip delay={0}>
                <Button className="h-9 min-w-11 rounded-full bg-white px-4 text-black shadow-sm hover:bg-white/90 sm:min-w-24" onPress={() => (isPlaying ? pauseAt() : playFrom())} size="sm" variant="ghost">
                  {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                  <span className="hidden sm:inline">{isPlaying ? t('admin.analytics.replay.pause') : t('admin.analytics.replay.play')}</span>
                </Button>
                <Tooltip.Content>{isPlaying ? t('admin.analytics.replay.pause') : t('admin.analytics.replay.play')}</Tooltip.Content>
              </Tooltip>
              <Tooltip delay={0}>
                <Button className="size-9 bg-white/10 text-white hover:bg-white/15" isIconOnly onPress={() => seekTo(currentTime + 5000)} size="sm" variant="ghost">
                  <SkipForward className="size-4" />
                </Button>
                <Tooltip.Content>{t('admin.analytics.replay.forward')}</Tooltip.Content>
              </Tooltip>
            </div>

            <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
              <div className="hidden overflow-hidden rounded-full border border-white/15 bg-white/10 p-0.5 sm:flex">
                {SPEED_OPTIONS.map(option => (
                  <button
                    className={cn(
                      'h-8 min-w-10 rounded-full px-2 text-xs font-medium text-white/70 transition hover:text-white',
                      speed === option && 'bg-white text-black shadow-sm hover:text-black',
                    )}
                    key={option}
                    onClick={() => handleSpeedChange(option)}
                    type="button"
                  >
                    {option}
                    x
                  </button>
                ))}
              </div>

              <Tooltip delay={0}>
                <Button className="size-9 bg-white/10 text-white hover:bg-white/15" isIconOnly onPress={() => void toggleFullscreen()} size="sm" variant="ghost">
                  {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </Button>
                <Tooltip.Content>{isFullscreen ? t('admin.analytics.replay.exitFullscreen') : t('admin.analytics.replay.fullscreen')}</Tooltip.Content>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

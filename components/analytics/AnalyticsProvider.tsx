'use client'

import type { ReactNode } from 'react'
import type { eventWithTime } from 'rrweb'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { record } from 'rrweb'

interface AnalyticsSettings {
  enabled: boolean
  replayEnabled: boolean
  blockedPaths: string[]
  maskTextSelectors: string[]
  blockSelectors: string[]
}

interface AnalyticsEventInput {
  eventId: string
  type: string
  name?: string
  path?: string
  title?: string
  target?: string
  value?: string
  durationMs?: number
  occurredAt: string
  payload?: Record<string, unknown>
}

interface AnalyticsRuntimeState {
  replayIndex: number
  sessionFinished: boolean
  sessionId: string
  sessionReady: boolean
  settings: AnalyticsSettings | null
  startTime: number
  visitorId: string
}

interface PendingReplayChunk {
  chunkIndex: number
  contentType: 'application/json'
  endTime: string | null
  eventCount: number
  payload: string
  sessionId: string
  startTime: string | null
}

const VISITOR_KEY = 'analytics_visitor_id'
const SESSION_STATE_KEY = 'analytics_session_state'
const PENDING_REPLAY_KEY = 'analytics_pending_replay_chunks'
const EVENT_FLUSH_SIZE = 10
const EVENT_FLUSH_INTERVAL = 5000
const REPLAY_FLUSH_SIZE = 40
const REPLAY_FLUSH_INTERVAL = 5000
const REPLAY_ROUTE_FLUSH_DELAY = 800
const REPLAY_UPLOAD_TIMEOUT = 10000
const BEACON_MAX_BYTES = 60_000
const RRWEB_EVENT_TYPE_FULL_SNAPSHOT = 2

let analyticsRuntimeState: AnalyticsRuntimeState | null = null

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return `${prefix}_${crypto.randomUUID()}`

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function getStorageValue(key: string) {
  try {
    return window.localStorage.getItem(key)
  }
  catch {
    return null
  }
}

function setStorageValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  }
  catch {
  }
}

function getVisitorId() {
  const existing = getStorageValue(VISITOR_KEY)

  if (existing)
    return existing

  const visitorId = createId('v')
  setStorageValue(VISITOR_KEY, visitorId)
  return visitorId
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function parseAnalyticsSettings(value: unknown): AnalyticsSettings | null {
  if (typeof value !== 'object' || value === null)
    return null

  const settings = value as Partial<AnalyticsSettings>

  if (
    typeof settings.enabled !== 'boolean'
    || typeof settings.replayEnabled !== 'boolean'
    || !isStringArray(settings.blockedPaths)
    || !isStringArray(settings.maskTextSelectors)
    || !isStringArray(settings.blockSelectors)
  ) {
    return null
  }

  return {
    enabled: settings.enabled,
    replayEnabled: settings.replayEnabled,
    blockedPaths: settings.blockedPaths,
    maskTextSelectors: settings.maskTextSelectors,
    blockSelectors: settings.blockSelectors,
  }
}

function readSessionState() {
  try {
    const value = window.sessionStorage.getItem(SESSION_STATE_KEY)
    if (!value)
      return null

    const parsed = JSON.parse(value) as Partial<AnalyticsRuntimeState>

    if (!parsed.sessionId || !parsed.visitorId || typeof parsed.replayIndex !== 'number' || typeof parsed.startTime !== 'number')
      return null

    return {
      replayIndex: parsed.replayIndex,
      sessionFinished: Boolean(parsed.sessionFinished),
      sessionId: parsed.sessionId,
      sessionReady: Boolean(parsed.sessionReady),
      settings: parseAnalyticsSettings(parsed.settings),
      startTime: parsed.startTime,
      visitorId: parsed.visitorId,
    } satisfies AnalyticsRuntimeState
  }
  catch {
    return null
  }
}

function writeSessionState(state: AnalyticsRuntimeState) {
  try {
    window.sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify(state))
  }
  catch {
  }
}

function getAnalyticsRuntimeState() {
  if (!analyticsRuntimeState) {
    analyticsRuntimeState = readSessionState() ?? {
      replayIndex: 0,
      sessionFinished: false,
      sessionId: createId('s'),
      sessionReady: false,
      settings: null,
      startTime: Date.now(),
      visitorId: getVisitorId(),
    }
    writeSessionState(analyticsRuntimeState)
  }

  return analyticsRuntimeState
}

function readPendingReplayChunks() {
  try {
    const value = window.sessionStorage.getItem(PENDING_REPLAY_KEY)
    if (!value)
      return []

    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed))
      return []

    return parsed.filter((chunk): chunk is PendingReplayChunk =>
      typeof chunk === 'object'
      && chunk !== null
      && typeof (chunk as PendingReplayChunk).sessionId === 'string'
      && typeof (chunk as PendingReplayChunk).chunkIndex === 'number'
      && typeof (chunk as PendingReplayChunk).payload === 'string'
      && typeof (chunk as PendingReplayChunk).eventCount === 'number')
  }
  catch {
    return []
  }
}

function writePendingReplayChunks(chunks: PendingReplayChunk[]) {
  try {
    if (!chunks.length) {
      window.sessionStorage.removeItem(PENDING_REPLAY_KEY)
      return true
    }

    window.sessionStorage.setItem(PENDING_REPLAY_KEY, JSON.stringify(chunks))
    return true
  }
  catch {
    return false
  }
}

function savePendingReplayChunk(chunk: PendingReplayChunk) {
  const chunks = readPendingReplayChunks()
  const existingIndex = chunks.findIndex(item => item.sessionId === chunk.sessionId && item.chunkIndex === chunk.chunkIndex)

  if (existingIndex >= 0)
    chunks[existingIndex] = chunk
  else
    chunks.push(chunk)

  return writePendingReplayChunks(chunks)
}

function removePendingReplayChunk(sessionId: string, chunkIndex: number) {
  const chunks = readPendingReplayChunks().filter(chunk => chunk.sessionId !== sessionId || chunk.chunkIndex !== chunkIndex)
  writePendingReplayChunks(chunks)
}

function shouldBlockPath(path: string, blockedPaths: string[]) {
  const normalizedPath = path.replace(/^\/[a-z]{2}(?=\/)/, '')

  return blockedPaths.some(blockedPath =>
    path === blockedPath
    || path.startsWith(`${blockedPath}/`)
    || normalizedPath === blockedPath
    || normalizedPath.startsWith(`${blockedPath}/`),
  )
}

function parseBrowser(userAgent: string) {
  if (userAgent.includes('Edg/'))
    return 'Edge'
  if (userAgent.includes('Chrome/'))
    return 'Chrome'
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/'))
    return 'Safari'
  if (userAgent.includes('Firefox/'))
    return 'Firefox'
  return 'Unknown'
}

function parseOs(userAgent: string) {
  if (userAgent.includes('Mac OS X'))
    return 'macOS'
  if (userAgent.includes('Windows'))
    return 'Windows'
  if (userAgent.includes('Android'))
    return 'Android'
  if (userAgent.includes('iPhone') || userAgent.includes('iPad'))
    return 'iOS'
  if (userAgent.includes('Linux'))
    return 'Linux'
  return 'Unknown'
}

function getDeviceType() {
  const width = window.innerWidth

  if (width < 768)
    return 'mobile'
  if (width < 1200)
    return 'tablet'
  return 'desktop'
}

function getElementLabel(target: EventTarget | null) {
  if (!(target instanceof Element))
    return null

  const label = target.getAttribute('aria-label')
    ?? target.getAttribute('title')
    ?? target.textContent
    ?? target.getAttribute('name')
    ?? target.getAttribute('id')

  return label?.trim().replace(/\s+/g, ' ').slice(0, 120) ?? null
}

function getElementSelector(target: EventTarget | null) {
  if (!(target instanceof Element))
    return null

  const tag = target.tagName.toLowerCase()
  const id = target.id ? `#${target.id}` : ''
  const classes = Array.from(target.classList).slice(0, 3).map(className => `.${className}`).join('')

  return `${tag}${id}${classes}`.slice(0, 500)
}

function createJsonBlob(body: unknown) {
  return new Blob([JSON.stringify(body)], { type: 'application/json' })
}

function postBeacon(url: string, body: unknown) {
  if (!('sendBeacon' in navigator))
    return false

  const blob = createJsonBlob(body)

  if (blob.size > BEACON_MAX_BYTES)
    return false

  return navigator.sendBeacon(url, blob)
}

async function postJson<T>(
  url: string,
  body?: unknown,
  options: { keepalive?: boolean, timeoutMs?: number } = {},
): Promise<T | null> {
  const { keepalive = true, timeoutMs } = options
  const controller = timeoutMs ? new AbortController() : null
  const timeoutId = timeoutMs ? window.setTimeout(() => controller?.abort(), timeoutMs) : null

  try {
    const response = await fetch(url, {
      method: body == null ? 'GET' : 'POST',
      headers: body == null ? undefined : { 'Content-Type': 'application/json' },
      keepalive,
      signal: controller?.signal,
      body: body == null ? undefined : JSON.stringify(body),
    })

    if (!response.ok)
      return null

    const result = await response.json() as { data: T | null }
    return result.data
  }
  catch {
    return null
  }
  finally {
    if (timeoutId)
      window.clearTimeout(timeoutId)
  }
}

async function sha256(value: string) {
  if (!crypto.subtle)
    return null

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const runtimeStateRef = useRef<AnalyticsRuntimeState | null>(null)
  const initializedRef = useRef(false)
  const initializingRef = useRef(false)
  const initializationPromiseRef = useRef<Promise<unknown> | null>(null)
  const disposedRef = useRef(false)
  const settingsRef = useRef<AnalyticsSettings | null>(null)
  const enabledRef = useRef(false)
  const replayEnabledRef = useRef(false)
  const sessionReadyRef = useRef(false)
  const sessionIdRef = useRef('')
  const visitorIdRef = useRef('')
  const startTimeRef = useRef(Date.now())
  const eventQueueRef = useRef<AnalyticsEventInput[]>([])
  const replayQueueRef = useRef<eventWithTime[]>([])
  const replayIndexRef = useRef(0)
  const replayInitialSnapshotUploadedRef = useRef(false)
  const routePageviewTrackedRef = useRef(false)
  const replayUploadingRef = useRef(false)
  const replayPendingFlushRef = useRef(false)
  const replayUploadFailedRef = useRef(false)
  const replayStoppedRef = useRef(false)
  const sessionFinishedRef = useRef(false)
  const stopReplayRef = useRef<(() => void) | undefined>(undefined)

  function getCurrentPath() {
    return `${window.location.pathname}${window.location.search}`
  }

  async function getSettings(runtimeState: AnalyticsRuntimeState) {
    if (settingsRef.current)
      return settingsRef.current

    const settings = runtimeState.settings ?? await postJson<AnalyticsSettings>('/api/analytics/settings')

    if (settings) {
      settingsRef.current = settings

      if (!runtimeState.settings) {
        runtimeState.settings = settings
        writeSessionState(runtimeState)
      }
    }

    return settings
  }

  function buildSessionPayload(path: string) {
    const userAgent = navigator.userAgent

    return {
      sessionId: sessionIdRef.current,
      visitorId: visitorIdRef.current,
      entryPath: path,
      referrer: document.referrer || null,
      userAgent,
      deviceType: getDeviceType(),
      browser: parseBrowser(userAgent),
      os: parseOs(userAgent),
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      metadata: {
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
      },
    }
  }

  async function ensureAnalyticsActive(path: string) {
    const runtimeState = runtimeStateRef.current ?? getAnalyticsRuntimeState()
    runtimeStateRef.current = runtimeState

    const settings = await getSettings(runtimeState)

    if (disposedRef.current)
      return false

    if (!settings?.enabled || shouldBlockPath(path, settings.blockedPaths)) {
      enabledRef.current = false
      replayEnabledRef.current = false
      stopReplay()
      return false
    }

    const shouldCreateSession = !sessionReadyRef.current || sessionFinishedRef.current

    enabledRef.current = true
    replayEnabledRef.current = settings.replayEnabled
    replayStoppedRef.current = false
    startReplay(settings)

    const session = !shouldCreateSession
      ? { sessionId: sessionIdRef.current }
      : await postJson('/api/analytics/sessions', buildSessionPayload(path))

    if (disposedRef.current) {
      replayQueueRef.current = []
      eventQueueRef.current = []
      stopReplay()
      return false
    }

    if (!session) {
      enabledRef.current = false
      replayEnabledRef.current = false
      replayQueueRef.current = []
      eventQueueRef.current = []
      stopReplay()
      return false
    }

    sessionReadyRef.current = true
    sessionFinishedRef.current = false
    runtimeState.sessionReady = true
    runtimeState.sessionFinished = false
    writeSessionState(runtimeState)

    void flushPendingReplayChunks()
    void flushReplay(true)

    return true
  }

  async function runWithInitializationLock<T>(task: () => Promise<T>) {
    if (initializationPromiseRef.current) {
      try {
        await initializationPromiseRef.current
      }
      catch {
      }
    }

    initializingRef.current = true
    const promise = task()
    initializationPromiseRef.current = promise

    try {
      return await promise
    }
    finally {
      initializingRef.current = false
      if (initializationPromiseRef.current === promise)
        initializationPromiseRef.current = null
    }
  }

  function enqueueEvent(event: Omit<AnalyticsEventInput, 'eventId' | 'occurredAt'>) {
    if (!enabledRef.current)
      return

    eventQueueRef.current.push({
      ...event,
      eventId: createId('e'),
      occurredAt: new Date().toISOString(),
    })

    if (eventQueueRef.current.length >= EVENT_FLUSH_SIZE)
      void flushEvents()
  }

  async function flushEvents(useBeacon = false) {
    if (!enabledRef.current || !sessionReadyRef.current || !eventQueueRef.current.length)
      return

    const events = eventQueueRef.current.splice(0, EVENT_FLUSH_SIZE)
    const body = {
      sessionId: sessionIdRef.current,
      visitorId: visitorIdRef.current,
      events,
    }

    if (useBeacon && postBeacon('/api/analytics/events', body))
      return

    const result = await postJson('/api/analytics/events', {
      sessionId: sessionIdRef.current,
      visitorId: visitorIdRef.current,
      events,
    })

    if (!result)
      eventQueueRef.current.unshift(...events)
  }

  async function flushReplay(force = false, useBeacon = false) {
    if (
      !replayEnabledRef.current
      || replayUploadFailedRef.current
      || !replayQueueRef.current.length
    ) {
      return
    }

    if (!force && replayQueueRef.current.length < REPLAY_FLUSH_SIZE)
      return

    if (replayUploadingRef.current) {
      replayPendingFlushRef.current = true
      return
    }

    replayUploadingRef.current = true
    const events = replayQueueRef.current.splice(0, REPLAY_FLUSH_SIZE)
    const chunkIndex = replayIndexRef.current
    replayIndexRef.current += 1
    if (runtimeStateRef.current) {
      runtimeStateRef.current.replayIndex = replayIndexRef.current
      writeSessionState(runtimeStateRef.current)
    }

    const payload = JSON.stringify(events)
    const replayChunk: PendingReplayChunk = {
      sessionId: sessionIdRef.current,
      chunkIndex,
      contentType: 'application/json',
      payload,
      eventCount: events.length,
      startTime: events[0] ? new Date(events[0].timestamp).toISOString() : null,
      endTime: events.at(-1) ? new Date(events.at(-1)!.timestamp).toISOString() : null,
    }
    const saved = savePendingReplayChunk(replayChunk)

    if (!sessionReadyRef.current) {
      replayUploadingRef.current = false
      replayPendingFlushRef.current = true

      if (!saved)
        replayQueueRef.current.unshift(...events)

      return
    }

    if (useBeacon) {
      if (postBeacon('/api/analytics/replay/upload', replayChunk)) {
        replayUploadingRef.current = false
        return
      }
    }

    const checksum = await sha256(payload)

    try {
      const uploaded = await postJson('/api/analytics/replay/upload', {
        ...replayChunk,
        checksum,
      }, { keepalive: false, timeoutMs: REPLAY_UPLOAD_TIMEOUT })

      if (uploaded)
        removePendingReplayChunk(sessionIdRef.current, chunkIndex)
    }
    catch {
    }
    finally {
      replayUploadingRef.current = false

      if (replayPendingFlushRef.current && replayQueueRef.current.length) {
        replayPendingFlushRef.current = false
        void flushReplay(force, useBeacon)
      }
    }
  }

  async function flushReplayAll(useBeacon = false) {
    while (
      replayEnabledRef.current
      && !replayUploadFailedRef.current
      && !replayUploadingRef.current
      && sessionReadyRef.current
      && replayQueueRef.current.length
    ) {
      await flushReplay(true, useBeacon)
    }
  }

  async function flushPendingReplayChunks() {
    if (!sessionReadyRef.current)
      return

    const chunks = readPendingReplayChunks()
    for (const chunk of chunks) {
      const checksum = await sha256(chunk.payload)
      const uploaded = await postJson('/api/analytics/replay/upload', {
        ...chunk,
        checksum,
      }, { keepalive: false, timeoutMs: REPLAY_UPLOAD_TIMEOUT })

      if (uploaded)
        removePendingReplayChunk(chunk.sessionId, chunk.chunkIndex)
    }
  }

  function startReplay(settings: AnalyticsSettings) {
    if (!replayEnabledRef.current || replayStoppedRef.current || stopReplayRef.current)
      return

    stopReplayRef.current = record({
      emit(event) {
        replayQueueRef.current.push(event)
        if (!replayInitialSnapshotUploadedRef.current && event.type === RRWEB_EVENT_TYPE_FULL_SNAPSHOT) {
          replayInitialSnapshotUploadedRef.current = true
          void flushReplay(true)
          return
        }

        if (replayQueueRef.current.length >= REPLAY_FLUSH_SIZE)
          void flushReplay()
      },
      maskAllInputs: true,
      blockClass: 'analytics-block',
      ignoreClass: 'analytics-ignore',
      maskTextClass: 'analytics-mask',
      blockSelector: settings.blockSelectors.join(','),
      maskTextSelector: settings.maskTextSelectors.join(','),
    })
  }

  function stopReplay() {
    if (replayStoppedRef.current)
      return

    replayStoppedRef.current = true
    stopReplayRef.current?.()
    stopReplayRef.current = undefined
  }

  function finishSession(useBeacon = false) {
    if (sessionFinishedRef.current)
      return

    sessionFinishedRef.current = true
    if (runtimeStateRef.current) {
      runtimeStateRef.current.sessionFinished = true
      writeSessionState(runtimeStateRef.current)
    }

    stopReplay()
    void flushEvents(useBeacon)
    void flushReplayAll(useBeacon)
    const body = {
      sessionId: sessionIdRef.current,
      durationMs: Date.now() - startTimeRef.current,
      exitPath: `${window.location.pathname}${window.location.search}`,
    }

    if (!useBeacon || !postBeacon('/api/analytics/sessions/finish', body))
      void postJson('/api/analytics/sessions/finish', body)
  }

  useEffect(() => {
    if (initializedRef.current)
      return

    initializedRef.current = true
    disposedRef.current = false
    const runtimeState = getAnalyticsRuntimeState()
    runtimeStateRef.current = runtimeState
    sessionIdRef.current = runtimeState.sessionId
    visitorIdRef.current = runtimeState.visitorId
    startTimeRef.current = runtimeState.startTime
    replayIndexRef.current = runtimeState.replayIndex
    sessionReadyRef.current = runtimeState.sessionReady
    sessionFinishedRef.current = runtimeState.sessionFinished
    settingsRef.current = runtimeState.settings

    async function initialize() {
      const path = getCurrentPath()
      const active = await runWithInitializationLock(() => ensureAnalyticsActive(path))

      if (!active)
        return

      enqueueEvent({
        type: 'pageview',
        name: 'Page view',
        path,
        title: document.title,
      })
      routePageviewTrackedRef.current = true

      void flushEvents()
    }

    void initialize()

    const eventInterval = window.setInterval(() => void flushEvents(), EVENT_FLUSH_INTERVAL)
    const replayInterval = window.setInterval(() => {
      void flushPendingReplayChunks()
      void flushReplay(true)
    }, REPLAY_FLUSH_INTERVAL)

    const handleClick = (event: MouseEvent) => {
      enqueueEvent({
        type: 'click',
        name: getElementLabel(event.target) ?? 'Click',
        path: `${window.location.pathname}${window.location.search}`,
        target: getElementSelector(event.target) ?? undefined,
        payload: {
          x: event.clientX,
          y: event.clientY,
        },
      })
    }

    const handleError = (event: ErrorEvent) => {
      enqueueEvent({
        type: 'error',
        name: event.message,
        path: `${window.location.pathname}${window.location.search}`,
        payload: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      enqueueEvent({
        type: 'error',
        name: 'Unhandled promise rejection',
        path: `${window.location.pathname}${window.location.search}`,
        payload: {
          reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
        },
      })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden')
        return

      void flushEvents(true)
      void flushPendingReplayChunks()
      void flushReplayAll(true)
    }

    const handlePageHide = () => finishSession(true)

    window.addEventListener('click', handleClick, { capture: true })
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      disposedRef.current = true
      window.clearInterval(eventInterval)
      window.clearInterval(replayInterval)
      window.removeEventListener('click', handleClick, { capture: true })
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      stopReplay()
      void flushEvents()
      void flushPendingReplayChunks()
      void flushReplay(true)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function trackRouteChange() {
      const path = getCurrentPath()
      const active = await runWithInitializationLock(() => ensureAnalyticsActive(path))

      if (cancelled || !active)
        return

      if (!routePageviewTrackedRef.current) {
        routePageviewTrackedRef.current = true
        return
      }

      enqueueEvent({
        type: 'pageview',
        name: 'Page view',
        path,
        title: document.title,
      })

      void flushEvents()
      void flushReplay(true)
    }

    void trackRouteChange()

    const replayFlushTimer = window.setTimeout(() => void flushReplay(true), REPLAY_ROUTE_FLUSH_DELAY)

    return () => {
      cancelled = true
      window.clearTimeout(replayFlushTimer)
    }
  }, [pathname])

  return children
}

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

const VISITOR_KEY = 'analytics_visitor_id'
const EVENT_FLUSH_SIZE = 10
const EVENT_FLUSH_INTERVAL = 5000
const REPLAY_FLUSH_SIZE = 200
const REPLAY_FLUSH_INTERVAL = 60000
const REPLAY_UPLOAD_TIMEOUT = 10000
const RRWEB_EVENT_TYPE_FULL_SNAPSHOT = 2

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

async function postJson<T>(url: string, body?: unknown, timeoutMs?: number): Promise<T | null> {
  const controller = timeoutMs ? new AbortController() : null
  const timeoutId = timeoutMs ? window.setTimeout(() => controller?.abort(), timeoutMs) : null

  try {
    const response = await fetch(url, {
      method: body == null ? 'GET' : 'POST',
      headers: body == null ? undefined : { 'Content-Type': 'application/json' },
      keepalive: !timeoutMs,
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
  const initializedRef = useRef(false)
  const enabledRef = useRef(false)
  const replayEnabledRef = useRef(false)
  const sessionIdRef = useRef('')
  const visitorIdRef = useRef('')
  const startTimeRef = useRef(Date.now())
  const eventQueueRef = useRef<AnalyticsEventInput[]>([])
  const replayQueueRef = useRef<eventWithTime[]>([])
  const replayIndexRef = useRef(0)
  const replayInitialSnapshotUploadedRef = useRef(false)
  const replayUploadingRef = useRef(false)
  const replayUploadFailedRef = useRef(false)
  const stopReplayRef = useRef<(() => void) | undefined>(undefined)

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

  async function flushEvents() {
    if (!enabledRef.current || !eventQueueRef.current.length)
      return

    const events = eventQueueRef.current.splice(0, EVENT_FLUSH_SIZE)
    const result = await postJson('/api/analytics/events', {
      sessionId: sessionIdRef.current,
      visitorId: visitorIdRef.current,
      events,
    })

    if (!result)
      eventQueueRef.current.unshift(...events)
  }

  async function flushReplay(force = false) {
    if (
      !replayEnabledRef.current
      || replayUploadFailedRef.current
      || replayUploadingRef.current
      || !replayQueueRef.current.length
    ) {
      return
    }

    if (!force && replayQueueRef.current.length < REPLAY_FLUSH_SIZE)
      return

    replayUploadingRef.current = true
    const events = replayQueueRef.current.splice(0, REPLAY_FLUSH_SIZE)
    const chunkIndex = replayIndexRef.current
    replayIndexRef.current += 1
    const payload = JSON.stringify(events)
    const checksum = await sha256(payload)

    try {
      const uploaded = await postJson('/api/analytics/replay/upload', {
        sessionId: sessionIdRef.current,
        chunkIndex,
        contentType: 'application/json',
        payload,
        eventCount: events.length,
        checksum,
        startTime: events[0] ? new Date(events[0].timestamp).toISOString() : null,
        endTime: events.at(-1) ? new Date(events.at(-1)!.timestamp).toISOString() : null,
      }, REPLAY_UPLOAD_TIMEOUT)

      if (!uploaded) {
        replayUploadFailedRef.current = true
        replayEnabledRef.current = false
        replayQueueRef.current = []
        stopReplayRef.current?.()
      }
    }
    catch {
      replayUploadFailedRef.current = true
      replayEnabledRef.current = false
      stopReplayRef.current?.()
      replayQueueRef.current = []
    }
    finally {
      replayUploadingRef.current = false
    }
  }

  useEffect(() => {
    if (initializedRef.current)
      return

    initializedRef.current = true
    sessionIdRef.current = createId('s')
    visitorIdRef.current = getVisitorId()

    async function initialize() {
      const settings = await postJson<AnalyticsSettings>('/api/analytics/settings')
      const path = `${window.location.pathname}${window.location.search}`

      if (!settings?.enabled || shouldBlockPath(path, settings.blockedPaths))
        return

      enabledRef.current = true
      replayEnabledRef.current = settings.replayEnabled

      const userAgent = navigator.userAgent

      await postJson('/api/analytics/sessions', {
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
      })

      enqueueEvent({
        type: 'pageview',
        name: 'Page view',
        path,
        title: document.title,
      })

      if (replayEnabledRef.current) {
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
    }

    void initialize()

    const eventInterval = window.setInterval(() => void flushEvents(), EVENT_FLUSH_INTERVAL)
    const replayInterval = window.setInterval(() => void flushReplay(), REPLAY_FLUSH_INTERVAL)

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

    const finishSession = () => {
      void flushEvents()
      void flushReplay(true)
      void postJson('/api/analytics/sessions/finish', {
        sessionId: sessionIdRef.current,
        durationMs: Date.now() - startTimeRef.current,
        exitPath: `${window.location.pathname}${window.location.search}`,
      })
    }

    window.addEventListener('click', handleClick, { capture: true })
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    window.addEventListener('pagehide', finishSession)

    return () => {
      window.clearInterval(eventInterval)
      window.clearInterval(replayInterval)
      window.removeEventListener('click', handleClick, { capture: true })
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
      window.removeEventListener('pagehide', finishSession)
      stopReplayRef.current?.()
    }
  }, [])

  useEffect(() => {
    if (!enabledRef.current)
      return

    enqueueEvent({
      type: 'pageview',
      name: 'Page view',
      path: `${window.location.pathname}${window.location.search}`,
      title: document.title,
    })
  }, [pathname])

  return children
}

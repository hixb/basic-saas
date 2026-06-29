'use client'

import type { AnalyticsOverviewResponse } from '~/apis/admin'
import type { ColumnDef, CrudOperations } from '~/components/crud'
import type { AnalyticsEvent, AnalyticsReplayChunk, AnalyticsSession } from '~/server/infrastructure/database/schema'
import { Button, Card, Chip, Tooltip as HeroTooltip, InputGroup, Label, ListBox, Modal, Select, TextField } from '@heroui/react'
import { Activity, Database, Eye, Globe2, MapPin, MousePointerClick, Play, Route, Search, ShieldCheck, Video, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminApi } from '~/apis/admin'
import { CrudTable } from '~/components/crud'
import { Popup } from '~/context/usePopupContext'
import { useCrudTable } from '~/hooks/useCrudTable'
import { usePendingFilters } from '~/hooks/usePendingFilters'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'

const ReplayPlayer = dynamic(() => import('./ReplayPlayer').then(mod => mod.ReplayPlayer), { ssr: false })

interface AnalyticsDetail {
  session: AnalyticsSession
  events: AnalyticsEvent[]
  chunks: AnalyticsReplayChunk[]
}

interface StatCard {
  label: string
  value: number
  icon: typeof Activity
  tone: string
}

const analyticsOperations: CrudOperations<AnalyticsSession> = {
  list: async ({ page, pageSize, keyword, sort, filters }) => {
    const result = await AdminApi.analytics.sessions({
      page,
      pageSize,
      keyword,
      country: filters?.country,
      hasReplay: filters?.hasReplay,
      dir: sort?.direction,
    })

    return {
      items: result.data ?? [],
      total: result.pagination?.total ?? 0,
    }
  },
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value)
}

function formatDateTime(value: Date | string | null) {
  if (!value)
    return '-'

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '-'
    : new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
}

function formatDuration(ms: number) {
  if (!ms)
    return '-'

  const seconds = Math.round(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes ? `${minutes}m ${rest}s` : `${rest}s`
}

function getDisplayDuration(session: AnalyticsSession) {
  const createdAt = new Date(session.createdAt).getTime()

  if (Number.isNaN(createdAt))
    return session.durationMs

  const liveDuration = session.isFinished ? 0 : Date.now() - createdAt
  return Math.max(session.durationMs, liveDuration)
}

function formatBytes(size: number) {
  if (size < 1024)
    return `${size} B`
  if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function getEventIcon(type: string) {
  if (type === 'click')
    return MousePointerClick
  if (type === 'pageview')
    return Eye
  if (type === 'error')
    return ShieldCheck
  return Activity
}

function buildLocation(session: AnalyticsSession) {
  return [session.city, session.region, session.country].filter(Boolean).join(', ') || '-'
}

function buildDevice(session: AnalyticsSession) {
  return [session.deviceType, session.browser, session.os].filter(Boolean).join(' / ') || '-'
}

function getCountryOptions(overview: AnalyticsOverviewResponse) {
  return overview.topCountries
    .map(item => item.country)
    .filter(country => country && country !== 'Unknown')
}

export function AnalyticsDashboard({ overview }: { overview: AnalyticsOverviewResponse }) {
  const t = useTypedTranslations('common')
  const [detail, setDetail] = useState<AnalyticsDetail | null>(null)
  const [replayEvents, setReplayEvents] = useState<any[]>([])
  const [replayOpen, setReplayOpen] = useState(false)
  const [replayLoading, setReplayLoading] = useState(false)
  const [traceOpen, setTraceOpen] = useState(false)
  const [traceLoading, setTraceLoading] = useState(false)

  const table = useCrudTable<AnalyticsSession>({
    operations: analyticsOperations,
    getRowId: row => row.sessionId,
    defaultPageSize: 20,
    syncUrl: true,
  })
  const filters = usePendingFilters(table.setFilters, table.setKeyword, table.filters)
  const countryOptions = useMemo(() => getCountryOptions(overview), [overview])
  const totalReplaySize = useMemo(() => detail?.chunks.reduce((sum, chunk) => sum + chunk.size, 0) ?? 0, [detail])
  const selectedSession = detail?.session

  const statCards: StatCard[] = [
    { label: t('admin.analytics.metrics.sessions'), value: overview.metrics.sessions, icon: Activity, tone: 'bg-sky-500/10 text-sky-600' },
    { label: t('admin.analytics.metrics.events'), value: overview.metrics.events, icon: Database, tone: 'bg-emerald-500/10 text-emerald-600' },
    { label: t('admin.analytics.metrics.replaySessions'), value: overview.metrics.replaySessions, icon: Video, tone: 'bg-violet-500/10 text-violet-600' },
    { label: t('admin.analytics.metrics.countries'), value: overview.metrics.countries, icon: Globe2, tone: 'bg-amber-500/10 text-amber-600' },
  ]

  const columns: ColumnDef<AnalyticsSession>[] = [
    {
      key: 'sessionId',
      label: t('admin.analytics.columns.visitor'),
      isRowHeader: true,
      width: 220,
      render: session => (
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-foreground">{session.visitorId}</p>
          <p className="mt-1 truncate font-mono text-xs text-muted">{session.ip ?? '-'}</p>
        </div>
      ),
    },
    {
      key: 'country',
      label: t('admin.analytics.columns.location'),
      width: 220,
      render: session => (
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="size-3.5 shrink-0 text-muted" />
          <span className="truncate">{buildLocation(session)}</span>
        </div>
      ),
    },
    {
      key: 'entryPath',
      label: t('admin.analytics.columns.entry'),
      width: 280,
      render: session => (
        <span className="block max-w-72 truncate" title={session.entryPath}>
          {session.entryPath}
        </span>
      ),
    },
    {
      key: 'deviceType',
      label: t('admin.analytics.columns.device'),
      width: 180,
      render: session => (
        <span className="block max-w-48 truncate" title={buildDevice(session)}>
          {buildDevice(session)}
        </span>
      ),
    },
    {
      key: 'eventCount',
      label: t('admin.analytics.columns.events'),
      width: 110,
      render: session => formatNumber(session.eventCount),
    },
    {
      key: 'hasReplay',
      label: t('admin.analytics.columns.replay'),
      width: 140,
      render: session => (
        <Chip color={session.hasReplay ? 'success' : 'default'} size="sm" variant="soft">
          {session.hasReplay ? t('admin.analytics.values.chunks', { count: session.replayChunkCount }) : t('admin.analytics.values.none')}
        </Chip>
      ),
    },
    {
      key: 'createdAt',
      label: t('admin.analytics.columns.created'),
      sortable: true,
      width: 150,
      render: session => formatDateTime(session.createdAt),
    },
  ]

  async function openDetail(sessionId: string) {
    const response = await AdminApi.analytics.detail(sessionId)

    if (response.code === 0)
      setDetail(response.data)
  }

  async function deleteSession(sessionId: string) {
    await AdminApi.analytics.deleteSession(sessionId)
    setDetail(null)
    table.refresh()
  }

  function _confirmDeleteSession(session: AnalyticsSession) {
    Popup.ActionDialog.visible({
      title: t('admin.analytics.delete.title'),
      content: (
        <div className="space-y-2 text-sm text-muted">
          <p>{t('admin.analytics.delete.description')}</p>
          <p className="font-mono text-xs text-foreground">{session.sessionId}</p>
        </div>
      ),
      status: 'danger',
      confirmText: t('admin.analytics.actions.delete'),
      cancelText: t('admin.crud.cancel'),
      onConfirm: () => deleteSession(session.sessionId),
    })
  }

  async function openTrace(sessionId: string) {
    setTraceLoading(true)
    setTraceOpen(true)

    await openDetail(sessionId)
    setTraceLoading(false)
  }

  async function openReplay(session: AnalyticsSession) {
    setDetail(current => current?.session.sessionId === session.sessionId
      ? current
      : { session, events: [], chunks: [] })
    setReplayLoading(true)
    setReplayEvents([])
    setReplayOpen(true)

    const response = await AdminApi.analytics.replayEvents(session.sessionId)

    if (response.code === 0 && response.data)
      setReplayEvents(response.data.events)

    setReplayLoading(false)
  }

  function handleReplayOpenChange(open: boolean) {
    setReplayOpen(open)

    if (!open) {
      setReplayEvents([])
      setReplayLoading(false)
    }
  }

  function handleTraceOpenChange(open: boolean) {
    setTraceOpen(open)

    if (!open)
      setTraceLoading(false)
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label}>
            <Card.Header>
              <div className="flex w-full items-start justify-between gap-3">
                <div>
                  <Card.Title className="text-sm font-medium text-muted">{label}</Card.Title>
                  <p className="mt-2 text-2xl font-bold text-foreground">{formatNumber(value)}</p>
                </div>
                <div className={`rounded-lg p-2 ${tone}`}>
                  <Icon className="size-4" />
                </div>
              </div>
            </Card.Header>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <Card.Header>
            <Card.Title>{t('admin.analytics.charts.sessionTrend')}</Card.Title>
          </Card.Header>
          <Card.Content>
            <ResponsiveContainer height={260} width="100%">
              <AreaChart data={overview.sessionTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsSessionsGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--foreground)" strokeDasharray="3 3" strokeOpacity={0.06} vertical={false} />
                <XAxis axisLine={false} dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} />
                <YAxis axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} />
                <Tooltip />
                <Area dataKey="sessions" fill="url(#analyticsSessionsGradient)" stroke="var(--accent)" strokeWidth={2} type="monotone" />
                <Area dataKey="events" fill="transparent" stroke="#2f8f6f" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{t('admin.analytics.charts.topCountries')}</Card.Title>
          </Card.Header>
          <Card.Content>
            <ResponsiveContainer height={260} width="100%">
              <BarChart data={overview.topCountries} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--foreground)" strokeDasharray="3 3" strokeOpacity={0.06} />
                <XAxis axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} type="number" />
                <YAxis axisLine={false} dataKey="country" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} type="category" width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--accent)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Card.Title>{t('admin.analytics.sessions.title')}</Card.Title>
              <Card.Description>{t('admin.analytics.sessions.description')}</Card.Description>
            </div>
            <TextField className="w-full lg:w-96">
              <InputGroup>
                <InputGroup.Prefix>
                  <Search className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  aria-label={t('admin.analytics.search.ariaLabel')}
                  onChange={event => table.setKeyword(event.target.value)}
                  placeholder={t('admin.analytics.search.placeholder')}
                  value={table.keyword}
                />
                {table.keyword && (
                  <InputGroup.Suffix>
                    <Button isIconOnly onPress={() => table.setKeyword('')} size="sm" variant="ghost">
                      <X className="size-4" />
                    </Button>
                  </InputGroup.Suffix>
                )}
              </InputGroup>
            </TextField>
          </div>
        </Card.Header>
        <Card.Content>
          <CrudTable columns={columns} handle={table}>
            <CrudTable.Toolbar
              labels={{
                refresh: t('admin.crud.refresh'),
                filters: t('admin.crud.filters'),
                openFilters: t('admin.crud.openFilters'),
                closeFilters: t('admin.crud.closeFilters'),
              }}
            />
            <CrudTable.FilterPanel>
              <CrudTable.FilterPanel.Content onApply={filters.apply} onClear={filters.clear}>
                <Select fullWidth onChange={value => filters.setField('hasReplay', String(value ?? ''))} value={filters.pending.hasReplay ?? 'all'} variant="secondary">
                  <Label>{t('admin.analytics.filters.replay')}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="all" textValue={t('admin.analytics.filters.allSessions')}>{t('admin.analytics.filters.allSessions')}</ListBox.Item>
                      <ListBox.Item id="true" textValue={t('admin.analytics.filters.hasReplay')}>{t('admin.analytics.filters.hasReplay')}</ListBox.Item>
                      <ListBox.Item id="false" textValue={t('admin.analytics.filters.noReplay')}>{t('admin.analytics.filters.noReplay')}</ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
                <Select fullWidth onChange={value => filters.setField('country', String(value ?? ''))} value={filters.pending.country ?? 'all'} variant="secondary">
                  <Label>{t('admin.analytics.filters.country')}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="all" textValue={t('admin.analytics.filters.allCountries')}>{t('admin.analytics.filters.allCountries')}</ListBox.Item>
                      {countryOptions.map(country => (
                        <ListBox.Item id={country} key={country} textValue={country}>{country}</ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </CrudTable.FilterPanel.Content>
            </CrudTable.FilterPanel>
            <CrudTable.Content
              aria-label={t('admin.analytics.sessions.ariaLabel')}
              labels={{
                actions: t('admin.crud.actions'),
                noResults: t('admin.analytics.sessions.empty'),
                rowsPerPage: t('admin.crud.rowsPerPage'),
                pageSummary: ({ start, end, total }) => t('admin.analytics.sessions.pageSummary', { start, end, total }),
                previous: t('admin.crud.previous'),
                next: t('admin.crud.next'),
              }}
              renderActions={({ row }) => {
                const session = row as AnalyticsSession

                return (
                  <>
                    <HeroTooltip delay={0}>
                      <Button isIconOnly onPress={() => void openTrace(session.sessionId)} size="sm" variant="tertiary">
                        <Route className="size-4" />
                      </Button>
                      <HeroTooltip.Content>{t('admin.analytics.actions.viewTrace')}</HeroTooltip.Content>
                    </HeroTooltip>
                    <HeroTooltip delay={0}>
                      <Button isDisabled={!session.hasReplay} isIconOnly onPress={() => void openReplay(session)} size="sm" variant="secondary">
                        <Play className="size-4" />
                      </Button>
                      <HeroTooltip.Content>{t('admin.analytics.actions.play')}</HeroTooltip.Content>
                    </HeroTooltip>
                    {/* <HeroTooltip delay={0}> */}
                    {/*  <Button isIconOnly onPress={() => confirmDeleteSession(session)} size="sm" variant="danger-soft"> */}
                    {/*    <Trash2 className="size-4" /> */}
                    {/*  </Button> */}
                    {/*  <HeroTooltip.Content>{t('admin.analytics.actions.delete')}</HeroTooltip.Content> */}
                    {/* </HeroTooltip> */}
                  </>
                )
              }}
            />
          </CrudTable>
        </Card.Content>
      </Card>

      <Modal isOpen={replayOpen} onOpenChange={handleReplayOpenChange}>
        <Modal.Backdrop variant="blur">
          <Modal.Container className="w-[min(96vw,1440px)] max-w-none px-3 sm:px-6" size="lg">
            <Modal.Dialog className="w-[min(96vw,1440px)]! max-w-none! overflow-hidden rounded-2xl border border-white/10 bg-black p-0 shadow-overlay">
              <Modal.Body className="bg-black p-0">
                {replayLoading
                  ? <div className="flex aspect-video max-h-[calc(92vh-4rem)] w-full items-center justify-center bg-background text-sm text-muted">{t('admin.analytics.replay.loading')}</div>
                  : (
                      <ReplayPlayer
                        events={replayEvents}
                        onClose={() => handleReplayOpenChange(false)}
                        subtitle={selectedSession ? `${buildLocation(selectedSession)} · ${buildDevice(selectedSession)}` : t('admin.analytics.replay.loading')}
                        title={t('admin.analytics.replay.title')}
                      />
                    )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal isOpen={traceOpen} onOpenChange={handleTraceOpenChange}>
        <Modal.Backdrop variant="blur">
          <Modal.Container className="w-[min(96vw,980px)] max-w-245">
            <Modal.Dialog className="max-h-[92vh] overflow-hidden p-0">
              <Modal.CloseTrigger />
              <Modal.Header className="border-b border-foreground/10 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-foreground">{t('admin.analytics.trace.title')}</h2>
                  {selectedSession && (
                    <p className="mt-0.5 max-w-[76vw] truncate font-mono text-xs text-muted">{selectedSession.sessionId}</p>
                  )}
                </div>
              </Modal.Header>
              <Modal.Body className="max-h-[calc(92vh-64px)] overflow-y-auto bg-surface-secondary p-4">
                {traceLoading && (
                  <div className="flex h-64 items-center justify-center rounded-lg bg-background text-sm text-muted">{t('admin.analytics.trace.loading')}</div>
                )}

                {!traceLoading && detail && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-foreground/10 bg-background p-3 text-sm md:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted">{t('admin.analytics.trace.ip')}</p>
                        <p className="mt-1 truncate font-mono">{detail.session.ip ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">{t('admin.analytics.trace.location')}</p>
                        <p className="mt-1 truncate">{buildLocation(detail.session)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">{t('admin.analytics.trace.device')}</p>
                        <p className="mt-1 truncate">{buildDevice(detail.session)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">{t('admin.analytics.trace.duration')}</p>
                        <p className="mt-1">{formatDuration(getDisplayDuration(detail.session))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">{t('admin.analytics.trace.replaySize')}</p>
                        <p className="mt-1">
                          {t('admin.analytics.values.chunks', { count: detail.chunks.length })}
                          {' '}
                          ·
                          {' '}
                          {formatBytes(totalReplaySize)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">{t('admin.analytics.trace.entry')}</p>
                        <p className="mt-1 truncate">{detail.session.entryPath}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">{t('admin.analytics.trace.exit')}</p>
                        <p className="mt-1 truncate">{detail.session.exitPath ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">{t('admin.analytics.trace.created')}</p>
                        <p className="mt-1">{formatDateTime(detail.session.createdAt)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {detail.events.map((event) => {
                        const Icon = getEventIcon(event.type)
                        return (
                          <div className="flex items-start gap-3 rounded-lg border border-foreground/10 bg-background p-3" key={event.id}>
                            <div className="mt-0.5 rounded-md bg-surface-secondary p-1.5 text-accent">
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium text-foreground">{event.name || event.type}</p>
                                <span className="shrink-0 text-xs text-muted">{formatDateTime(event.occurredAt)}</span>
                              </div>
                              <p className="mt-1 wrap-break-word text-xs text-muted">{event.path || event.target || '-'}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </section>
  )
}

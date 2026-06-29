'use client'

import type { ComponentType } from 'react'
import type { DashboardSummary } from '~/server/application/admin/dashboard.query'
import { Card, Chip } from '@heroui/react'
import { AlertTriangle, Archive, BookOpen, CircleDot, FileText, FolderTree, ShieldAlert, Users } from 'lucide-react'
import { useLocale } from 'next-intl'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'

interface DashboardProps {
  data: DashboardSummary
}

interface StatCard {
  title: string
  value: number
  description: string
  icon: ComponentType<{ className?: string }>
  tone: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#d99a3d',
  published: '#2f8f6f',
  archived: '#77808c',
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#4f8cc9',
  medium: '#d99a3d',
  high: '#c84d36',
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value)
}

function formatShortDate(value: unknown, locale: string) {
  if (typeof value !== 'string')
    return ''

  const [year, month, day] = value.split('-').map(Number)
  const date = year && month && day ? new Date(year, month - 1, day) : new Date(value)

  if (Number.isNaN(date.getTime()))
    return value

  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date)
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime()))
    return value

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getSafeMetricValue(data: Array<{ key: string, value: number }>, key: string) {
  return data.find(item => item.key === key)?.value ?? 0
}

export function Dashboard({ data }: DashboardProps) {
  const locale = useLocale()
  const t = useTypedTranslations()
  const materialChartData = ['published', 'draft', 'archived'].map(status => ({
    status: t(`common.admin.status.${status}` as any),
    rawStatus: status,
    value: getSafeMetricValue(data.materialStatuses, status),
  }))
  const severityChartData = ['high', 'medium', 'low'].map(severity => ({
    severity: t(`common.admin.sensitiveWords.severity.${severity}` as any),
    rawSeverity: severity,
    value: getSafeMetricValue(data.sensitiveSeverities, severity),
  }))
  const statCards: StatCard[] = [
    {
      title: t('common.admin.dashboard.metrics.totalInquiries'),
      value: data.metrics.totalInquiries,
      description: t('common.admin.dashboard.metrics.totalInquiriesDescription'),
      icon: FileText,
      tone: 'bg-sky-500/10 text-sky-600',
    },
    {
      title: t('common.admin.dashboard.metrics.newInquiries'),
      value: data.metrics.newInquiries,
      description: t('common.admin.dashboard.metrics.newInquiriesDescription'),
      icon: CircleDot,
      tone: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      title: t('common.admin.dashboard.metrics.publishedMaterials'),
      value: data.metrics.publishedMaterials,
      description: t('common.admin.dashboard.metrics.publishedMaterialsDescription', { total: data.metrics.totalMaterials }),
      icon: BookOpen,
      tone: 'bg-violet-500/10 text-violet-600',
    },
    {
      title: t('common.admin.dashboard.metrics.sensitiveHits'),
      value: data.metrics.sensitiveHits,
      description: t('common.admin.dashboard.metrics.sensitiveHitsDescription'),
      icon: ShieldAlert,
      tone: 'bg-rose-500/10 text-rose-600',
    },
    {
      title: t('common.admin.dashboard.metrics.activeCategories'),
      value: data.metrics.activeCategories,
      description: t('common.admin.dashboard.metrics.activeCategoriesDescription'),
      icon: FolderTree,
      tone: 'bg-amber-500/10 text-amber-600',
    },
    {
      title: t('common.admin.dashboard.metrics.activeSensitiveWords'),
      value: data.metrics.activeSensitiveWords,
      description: t('common.admin.dashboard.metrics.activeSensitiveWordsDescription'),
      icon: AlertTriangle,
      tone: 'bg-orange-500/10 text-orange-600',
    },
    {
      title: t('common.admin.dashboard.metrics.activeUsers'),
      value: data.metrics.activeUsers,
      description: t('common.admin.dashboard.metrics.activeUsersDescription'),
      icon: Users,
      tone: 'bg-cyan-500/10 text-cyan-600',
    },
    {
      title: t('common.admin.dashboard.metrics.archivedMaterials'),
      value: getSafeMetricValue(data.materialStatuses, 'archived'),
      description: t('common.admin.dashboard.metrics.archivedMaterialsDescription'),
      icon: Archive,
      tone: 'bg-slate-500/10 text-slate-600',
    },
  ]

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ title, value, description, icon: Icon, tone }) => (
          <Card key={title}>
            <Card.Header>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Card.Title className="text-sm font-medium text-muted">{title}</Card.Title>
                  <p className="mt-2 text-2xl font-bold text-foreground">{formatNumber(value, locale)}</p>
                </div>
                <div className={`rounded-lg p-2 ${tone}`}>
                  <Icon className="size-4" />
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <p className="text-xs leading-5 text-muted">{description}</p>
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <Card>
          <Card.Header>
            <Card.Title>{t('common.admin.dashboard.charts.inquiryTrend')}</Card.Title>
            <p className="mt-0.5 text-sm text-muted">{t('common.admin.dashboard.charts.inquiryTrendDescription')}</p>
          </Card.Header>
          <Card.Content>
            <ResponsiveContainer className="[&_.recharts-surface]:outline-none" height={260} width="100%">
              <AreaChart data={data.inquiryTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="inquiryGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--foreground)" strokeDasharray="3 3" strokeOpacity={0.06} vertical={false} />
                <XAxis axisLine={false} dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={value => formatShortDate(value, locale)} tickLine={false} />
                <YAxis axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} />
                <Tooltip
                  content={({ label, payload }) => (
                    <div className="min-w-40 rounded-xl bg-background p-3 text-xs shadow-sm">
                      <p className="mb-2 font-medium text-foreground">{formatShortDate(label, locale)}</p>
                      {payload?.map((item, index) => (
                        <div className="flex items-center justify-between gap-4" key={`${String(item.dataKey)}-${index}`}>
                          <span className="text-muted">
                            {item.dataKey === 'sensitiveHits'
                              ? t('common.admin.dashboard.charts.sensitiveHits')
                              : t('common.admin.dashboard.charts.inquiries')}
                          </span>
                          <span className="font-mono font-medium text-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  cursor={false}
                />
                <Area activeDot={{ r: 5 }} connectNulls dataKey="inquiries" dot={{ r: 3, strokeWidth: 2 }} fill="url(#inquiryGradient)" stroke="var(--accent)" strokeWidth={2.5} type="monotone" />
                <Area activeDot={{ r: 5 }} connectNulls dataKey="sensitiveHits" dot={{ r: 3, strokeWidth: 2 }} fill="transparent" stroke="#c84d36" strokeWidth={2.5} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{t('common.admin.dashboard.charts.countryDistribution')}</Card.Title>
            <p className="mt-0.5 text-sm text-muted">{t('common.admin.dashboard.charts.countryDistributionDescription')}</p>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {data.countryDistribution.map(item => (
                <div className="flex items-center gap-3" key={`${item.country}-${item.emoji}`}>
                  <span className="text-lg">{item.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-foreground">{item.country}</span>
                      <span className="font-mono text-muted">{item.count}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/8">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max((item.count / Math.max(data.metrics.totalInquiries, 1)) * 100, 4)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {!data.countryDistribution.length && (
                <p className="rounded-lg bg-surface-secondary p-4 text-sm text-muted">{t('common.admin.dashboard.empty.countries')}</p>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <Card.Header>
            <Card.Title>{t('common.admin.dashboard.charts.materialStatus')}</Card.Title>
            <p className="mt-0.5 text-sm text-muted">{t('common.admin.dashboard.charts.materialStatusDescription')}</p>
          </Card.Header>
          <Card.Content>
            <ResponsiveContainer className="[&_.recharts-surface]:outline-none" height={220} width="100%">
              <BarChart data={materialChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--foreground)" strokeDasharray="3 3" strokeOpacity={0.06} vertical={false} />
                <XAxis axisLine={false} dataKey="status" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} />
                <YAxis axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} />
                <Tooltip cursor={false} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {materialChartData.map(item => <Cell fill={STATUS_COLORS[item.rawStatus]} key={item.rawStatus} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{t('common.admin.dashboard.charts.sensitiveSeverity')}</Card.Title>
            <p className="mt-0.5 text-sm text-muted">{t('common.admin.dashboard.charts.sensitiveSeverityDescription')}</p>
          </Card.Header>
          <Card.Content>
            <ResponsiveContainer className="[&_.recharts-surface]:outline-none" height={220} width="100%">
              <PieChart>
                <Pie data={severityChartData} dataKey="value" innerRadius={54} nameKey="severity" outerRadius={86} paddingAngle={3}>
                  {severityChartData.map(item => <Cell fill={SEVERITY_COLORS[item.rawSeverity]} key={item.rawSeverity} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-2">
              {severityChartData.map(item => (
                <Chip key={item.rawSeverity} size="sm" variant="soft">
                  {item.severity}
                  :
                  {' '}
                  {item.value}
                </Chip>
              ))}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{t('common.admin.dashboard.recent.title')}</Card.Title>
            <p className="mt-0.5 text-sm text-muted">{t('common.admin.dashboard.recent.description')}</p>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {data.recentInquiries.map(item => (
                <div className="rounded-lg border border-foreground/10 p-3" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.companyName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {item.contactName}
                        {' '}
                        ·
                        {' '}
                        {item.email}
                      </p>
                    </div>
                    <Chip color={item.sensitiveHit ? 'danger' : 'success'} size="sm" variant="soft">
                      {item.sensitiveHit ? t('common.admin.inquiries.sensitive.hit') : t('common.admin.inquiries.sensitive.clean')}
                    </Chip>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>
                      {item.emoji}
                      {' '}
                      {[item.city, item.country].filter(Boolean).join(', ') || t('common.admin.dashboard.recent.unknownLocation')}
                    </span>
                    <span>{formatDateTime(item.createdAt, locale)}</span>
                  </div>
                </div>
              ))}
              {!data.recentInquiries.length && (
                <p className="rounded-lg bg-surface-secondary p-4 text-sm text-muted">{t('common.admin.dashboard.empty.inquiries')}</p>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>
    </section>
  )
}

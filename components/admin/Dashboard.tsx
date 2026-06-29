'use client'

import type { ComponentType } from 'react'
import { Button, Card, Chip, ListBox, Select, Tabs } from '@heroui/react'
import { DollarSign, ShoppingCart, TrendingDown, TrendingUp, Users } from 'lucide-react'
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
import { Calendar, Download, RefreshRight } from '~/components/icons'

interface StatCard {
  title: string
  value: string
  change: string
  up: boolean
  icon: ComponentType<{ className?: string }>
}

const STAT_CARDS: StatCard[] = [
  { title: 'Total Revenue', value: '$228,441', change: '+12.5%', up: true, icon: DollarSign },
  { title: 'New Orders', value: '1,429', change: '+8.2%', up: true, icon: ShoppingCart },
  { title: 'Active Users', value: '3,892', change: '-3.1%', up: false, icon: Users },
  { title: 'Conversion', value: '5.24%', change: '+0.4%', up: true, icon: TrendingUp },
]

const SALES_SUMMARY = [
  { label: 'Weekly', value: '$28,441', change: '+20%', up: true },
  { label: 'Monthly', value: '$87.2K', change: '+14%', up: true },
  { label: 'Quarterly', value: '$241K', change: '-5%', up: false },
]

const HEIGHT_LIST = ['Low', 'Medium', 'High']

const SALES_DATA = [
  { weekday: 'Mon', Low: 120, Medium: 280, High: 180 },
  { weekday: 'Tue', Low: 150, Medium: 320, High: 220 },
  { weekday: 'Wed', Low: 180, Medium: 250, High: 150 },
  { weekday: 'Thu', Low: 140, Medium: 290, High: 180 },
  { weekday: 'Fri', Low: 160, Medium: 270, High: 190 },
  { weekday: 'Sat', Low: 130, Medium: 240, High: 210 },
  { weekday: 'Sun', Low: 170, Medium: 300, High: 240 },
]

const USER_GROWTH = [
  { month: 'Jan', users: 420 },
  { month: 'Feb', users: 580 },
  { month: 'Mar', users: 650 },
  { month: 'Apr', users: 790 },
  { month: 'May', users: 1020 },
  { month: 'Jun', users: 1280 },
  { month: 'Jul', users: 1550 },
]

function formatWeekday(weekday: string) {
  const day = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }[weekday] ?? 0
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(2024, 0, day))
}

export function Dashboard() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs>
          <Tabs.ListContainer>
            <Tabs.List aria-label="Dashboard views">
              <Tabs.Tab id="overview">
                Overview
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="analytics">
                Analytics
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="reports">
                Reports
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button className="size-9" isIconOnly size="sm" variant="tertiary">
            <RefreshRight className="size-4" />
          </Button>
          <Select placeholder="Last 7 days" variant="secondary">
            <Select.Trigger className="rounded-full flex items-center">
              <Calendar className="size-4 text-muted mr-2" />
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="7" textValue="Last 7 days">
                  Last 7 days
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="30" textValue="Last 30 days">
                  Last 30 days
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="180" textValue="Last 180 days">
                  Last 180 days
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
          <Button size="sm">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map(({ title, value, change, up, icon: Icon }) => (
          <Card key={title}>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title className="text-sm font-medium text-muted">{title}</Card.Title>
                <div className="rounded-lg bg-accent/10 p-1.5">
                  <Icon className="size-4 text-accent" />
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <div className="mt-2 flex items-center gap-2">
                <Chip color={up ? 'success' : 'danger'} size="sm" variant="soft">
                  {up
                    ? <TrendingUp className="mr-0.5 size-3" />
                    : <TrendingDown className="mr-0.5 size-3" />}
                  {change}
                </Chip>
                <span className="text-xs text-muted">vs last month</span>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Sales Performance</Card.Title>
            <p className="mt-0.5 text-sm text-muted">Weekly breakdown by tier</p>
          </Card.Header>
          <Card.Content className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              {SALES_SUMMARY.map(({ label, value, change, up }) => (
                <div className="space-y-1" key={label}>
                  <p className="text-lg font-semibold text-foreground">{value}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Chip color={up ? 'success' : 'danger'} size="sm" variant="soft">
                      {change}
                    </Chip>
                    <span className="text-xs text-muted">{label}</span>
                  </div>
                </div>
              ))}
            </div>

            <ResponsiveContainer className="[&_.recharts-surface]:outline-none" height={200} width="100%">
              <BarChart
                accessibilityLayer
                data={SALES_DATA}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <XAxis
                  axisLine={false}
                  dataKey="weekday"
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ label, payload }) => (
                    <div className="min-w-28 rounded-xl bg-background p-2 text-xs shadow-sm">
                      <p className="mb-1.5 font-medium text-foreground">{formatWeekday(label as string)}</p>
                      {payload?.map((p, i) => (
                        <div className="flex items-center justify-between gap-3" key={`${i}-${p.name}`}>
                          <div className="flex items-center gap-1.5">
                            <div className="size-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                            <span className="text-muted">{p.name}</span>
                          </div>
                          <span className="font-mono font-medium text-foreground">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  cursor={false}
                />
                {HEIGHT_LIST.map((category, index) => (
                  <Bar
                    animationDuration={450}
                    animationEasing="ease"
                    barSize={22}
                    dataKey={category}
                    fill="var(--accent)"
                    key={`${category}-${index}`}
                    radius={index === HEIGHT_LIST.length - 1 ? [4, 4, 0, 0] : 0}
                    stackId="bars"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>User Growth</Card.Title>
            <p className="mt-0.5 text-sm text-muted">New registrations over time</p>
          </Card.Header>
          <Card.Content className="flex flex-col gap-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">3,892</p>
                <p className="mt-0.5 text-sm text-muted">Total active users</p>
              </div>
              <Chip color="success" size="sm" variant="soft">
                <TrendingUp className="mr-0.5 size-3" />
                +20.3%
              </Chip>
            </div>

            <ResponsiveContainer className="[&_.recharts-surface]:outline-none" height={200} width="100%">
              <AreaChart
                data={USER_GROWTH}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="userGrowthGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--foreground)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.06}
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="month"
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ label, payload }) => (
                    <div className="rounded-xl bg-background p-2 text-xs shadow-sm">
                      <p className="mb-1.5 font-medium text-foreground">{label}</p>
                      {payload?.map((p, i) => (
                        <div className="flex items-center justify-between gap-3" key={`${i}-${p.name}`}>
                          <span className="text-muted">Users</span>
                          <span className="font-mono font-medium text-foreground">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  cursor={false}
                />
                <Area
                  animationDuration={600}
                  dataKey="users"
                  fill="url(#userGrowthGradient)"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>
      </div>
    </section>
  )
}

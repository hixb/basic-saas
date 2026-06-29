'use client'

import type { ComponentType } from 'react'
import { Card, Chip } from '@heroui/react'
import { CreditCard, TrendingDown, TrendingUp, UserCheck, UserPlus, Users } from 'lucide-react'

interface StatItem {
  label: string
  value: string
  change: string
  subtext: string
  up: boolean
  icon: ComponentType<{ className?: string }>
}

const STATS: StatItem[] = [
  {
    label: 'Total Users',
    value: '10',
    change: '+3',
    subtext: 'all time',
    up: true,
    icon: Users,
  },
  {
    label: 'Active Users',
    value: '7',
    change: '+2',
    subtext: '70% of total',
    up: true,
    icon: UserCheck,
  },
  {
    label: 'Paid Users',
    value: '4,567',
    change: '+18%',
    subtext: 'vs last month',
    up: true,
    icon: CreditCard,
  },
  {
    label: 'New This Month',
    value: '23',
    change: '+5%',
    subtext: 'registered',
    up: true,
    icon: UserPlus,
  },
]

export function UserStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map(({ label, value, change, subtext, up, icon: Icon }) => (
        <Card key={label}>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title className="text-sm font-medium text-muted">{label}</Card.Title>
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
              <span className="text-xs text-muted">{subtext}</span>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  )
}

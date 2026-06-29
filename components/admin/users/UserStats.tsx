'use client'

import type { ComponentType } from 'react'
import { Card, Chip } from '@heroui/react'
import { UserCheck, UserPlus, Users, UserX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AdminApi } from '~/apis/admin'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'
import { ResponseCode } from '~/shared/types/api.type'

interface UserRow {
  id: number
  status: number
  createdAt: string
}

interface StatItem {
  label: string
  value: number
  subtext: string
  icon: ComponentType<{ className?: string }>
}

function isSameMonth(value: string) {
  const date = new Date(value)
  const now = new Date()

  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

export function UserStats() {
  const t = useTypedTranslations()
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let mounted = true

    AdminApi.users.list({ page: 1, pageSize: 500 }).then((result) => {
      if (!mounted || result.code !== ResponseCode.SUCCESS)
        return

      setUsers((result.data ?? []) as UserRow[])
      setTotal(result.pagination?.total ?? result.data?.length ?? 0)
    })

    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo<StatItem[]>(() => {
    const activeCount = users.filter(user => user.status === 1).length
    const disabledCount = users.filter(user => user.status !== 1).length
    const newThisMonth = users.filter(user => isSameMonth(user.createdAt)).length
    const activePercent = total > 0 ? Math.round((activeCount / total) * 100) : 0

    return [
      {
        label: t('common.admin.users.stats.total'),
        value: total,
        subtext: t('common.admin.users.stats.totalSubtext'),
        icon: Users,
      },
      {
        label: t('common.admin.users.stats.active'),
        value: activeCount,
        subtext: t('common.admin.users.stats.activeSubtext', { percent: activePercent }),
        icon: UserCheck,
      },
      {
        label: t('common.admin.users.stats.disabled'),
        value: disabledCount,
        subtext: t('common.admin.users.stats.disabledSubtext'),
        icon: UserX,
      },
      {
        label: t('common.admin.users.stats.newThisMonth'),
        value: newThisMonth,
        subtext: t('common.admin.users.stats.newThisMonthSubtext'),
        icon: UserPlus,
      },
    ]
  }, [t, total, users])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, subtext, icon: Icon }) => (
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
              <Chip color="success" size="sm" variant="soft">
                {value}
              </Chip>
              <span className="text-xs text-muted">{subtext}</span>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  )
}

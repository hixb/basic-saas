'use client'

import type { ColumnDef, CrudOperations } from '~/components/crud'
import { Chip } from '@heroui/react'
import { AdminApi } from '~/apis/admin'
import { CrudTable } from '~/components/crud'
import { CopyText } from '~/components/feedback/CopyText'
import { useCrudTable } from '~/hooks/useCrudTable'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'

interface InquiryRow {
  id: number
  contactName: string
  companyName: string
  email: string
  phone: string
  description: string
  ip: string | null
  countryCode: string | null
  region: string | null
  country: string | null
  city: string | null
  emoji: string
  sensitiveHit: boolean
  status: string
  createdAt: string
}

const operations: CrudOperations<InquiryRow> = {
  list: async ({ page, pageSize, keyword, sort }) => {
    const result = await AdminApi.inquiries.list({
      page,
      pageSize,
      keyword,
      dir: sort?.direction,
    })

    return {
      items: result.data ?? [],
      total: result.pagination?.total ?? 0,
    }
  },
}

export function InquiriesTable() {
  const t = useTypedTranslations()
  const handle = useCrudTable<InquiryRow>({
    operations,
    getRowId: row => row.id,
    syncUrl: true,
  })

  const columns: ColumnDef<InquiryRow>[] = [
    { key: 'id', label: 'ID', isRowHeader: true, width: 90, render: row => <CopyText>{row.id}</CopyText> },
    { key: 'contactName', label: t('common.admin.inquiries.columns.contact') },
    { key: 'companyName', label: t('common.admin.inquiries.columns.company') },
    { key: 'email', label: t('common.admin.inquiries.columns.email') },
    { key: 'phone', label: t('common.admin.inquiries.columns.phone') },
    {
      key: 'country',
      label: t('common.admin.inquiries.columns.location'),
      render: row => (
        <span className="inline-flex items-center gap-2">
          <span>{row.emoji || '🏳️'}</span>
          <span>{row.city || row.country || '-'}</span>
        </span>
      ),
    },
    {
      key: 'sensitiveHit',
      label: t('common.admin.inquiries.columns.sensitive'),
      render: row => (
        <Chip color={row.sensitiveHit ? 'danger' : 'success'} size="sm" variant="soft">
          {row.sensitiveHit ? t('common.admin.inquiries.sensitive.hit') : t('common.admin.inquiries.sensitive.clean')}
        </Chip>
      ),
    },
    {
      key: 'status',
      label: t('common.admin.inquiries.columns.status'),
      render: row => <Chip size="sm" variant="soft">{row.status}</Chip>,
    },
    {
      key: 'createdAt',
      label: t('common.admin.inquiries.columns.createdAt'),
      render: row => new Date(row.createdAt).toLocaleString(),
    },
  ]

  return (
    <CrudTable columns={columns} handle={handle}>
      <CrudTable.Toolbar
        labels={{
          export: t('common.admin.crud.export'),
          refresh: t('common.admin.crud.refresh'),
        }}
        showExport
      />
      <CrudTable.Content
        aria-label={t('common.admin.pages.inquiries.title')}
        expandable
        labels={{
          actions: t('common.admin.crud.actions'),
          noResults: t('common.admin.crud.noResults'),
          rowsPerPage: t('common.admin.crud.rowsPerPage'),
          pageSummary: ({ start, end, total }) => t('common.admin.crud.pageSummary', { start, end, total }),
          previous: t('common.admin.crud.previous'),
          next: t('common.admin.crud.next'),
          selectAll: t('common.admin.crud.selectAll'),
          selectRow: t('common.admin.crud.selectRow'),
        }}
        renderDetail={(row) => {
          const inquiry = row as InquiryRow

          return (
            <div className="grid gap-4 rounded-lg bg-surface-secondary p-4 text-sm leading-6 text-muted">
              <div>
                <p className="font-medium text-foreground">{t('common.admin.inquiries.columns.description')}</p>
                <p className="mt-1 whitespace-pre-wrap">{inquiry.description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="font-medium text-foreground">{t('common.admin.inquiries.geo.ip')}</p>
                  <p className="mt-1">{inquiry.ip ?? '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('common.admin.inquiries.geo.countryCode')}</p>
                  <p className="mt-1">{inquiry.countryCode ?? '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('common.admin.inquiries.geo.region')}</p>
                  <p className="mt-1">{inquiry.region ?? '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('common.admin.inquiries.geo.country')}</p>
                  <p className="mt-1">{inquiry.country ?? '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('common.admin.inquiries.geo.city')}</p>
                  <p className="mt-1">{inquiry.city ?? '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('common.admin.inquiries.geo.emoji')}</p>
                  <p className="mt-1">{inquiry.emoji || '🏳️'}</p>
                </div>
              </div>
            </div>
          )
        }}
      />
    </CrudTable>
  )
}

'use client'

import type { ColumnDef, CrudOperations } from '~/components/crud'
import { Chip } from '@heroui/react'
import { useLocale } from 'next-intl'
import { AdminApi } from '~/apis/admin'
import { CrudTable } from '~/components/crud'
import { CopyText } from '~/components/feedback/CopyText'
import { useCrudTable } from '~/hooks/useCrudTable'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'

interface UserRow {
  id: number
  username: string
  email: string
  nickname: string
  status: number
  createdAt: string
}

const operations: CrudOperations<UserRow> = {
  list: async ({ page, pageSize, keyword, sort }) => {
    const result = await AdminApi.users.list({
      page,
      pageSize,
      keyword,
      sort: sort?.column,
      dir: sort?.direction,
    })

    return {
      items: result.data ?? [],
      total: result.pagination?.total ?? 0,
    }
  },
}

export function TableWrapper() {
  const locale = useLocale()
  const t = useTypedTranslations()
  const handle = useCrudTable<UserRow>({
    operations,
    getRowId: row => row.id,
    syncUrl: true,
  })

  const columns: ColumnDef<UserRow>[] = [
    { key: 'id', label: 'ID', isRowHeader: true, width: 90, render: row => <CopyText>{row.id}</CopyText> },
    { key: 'username', label: t('common.admin.users.columns.username'), sortable: true },
    { key: 'nickname', label: t('common.admin.users.columns.nickname') },
    { key: 'email', label: t('common.admin.users.columns.email'), sortable: true },
    {
      key: 'status',
      label: t('common.admin.users.columns.status'),
      render: row => (
        <Chip color={row.status === 1 ? 'success' : 'danger'} size="sm" variant="soft">
          {row.status === 1 ? t('common.admin.status.active') : t('common.admin.status.disabled')}
        </Chip>
      ),
    },
    {
      key: 'createdAt',
      label: t('common.admin.users.columns.createdAt'),
      sortable: true,
      render: row => new Date(row.createdAt).toLocaleString(locale),
    },
  ]

  return (
    <CrudTable columns={columns} handle={handle}>
      <CrudTable.Toolbar
        labels={{
          export: t('common.admin.crud.export'),
          refresh: t('common.admin.crud.refresh'),
          filters: t('common.admin.crud.filters'),
          openFilters: t('common.admin.crud.openFilters'),
          closeFilters: t('common.admin.crud.closeFilters'),
          deleteSelected: t('common.admin.crud.deleteSelected'),
        }}
        showExport
      />
      <CrudTable.Content
        aria-label={t('common.admin.pages.users.title')}
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
      />
    </CrudTable>
  )
}

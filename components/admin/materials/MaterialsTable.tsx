'use client'

import type { ColumnDef, CrudOperations } from '~/components/crud'
import { Button, Chip } from '@heroui/react'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AdminApi } from '~/apis/admin'
import { CrudTable } from '~/components/crud'
import { CopyText } from '~/components/feedback/CopyText'
import { useCrudTable } from '~/hooks/useCrudTable'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'

interface MaterialRow {
  id: number
  title: string
  summary: string
  category: string
  content: string
  coverKey: string | null
  coverUrl?: string | null
  fileName: string | null
  fileSize: number
  fileKey: string | null
  fileContentType: string | null
  fileUrl?: string | null
  status: string
  createdAt: string
}

interface MaterialCategoryOption {
  id: number
  name: string
  slug: string
}

const operations: CrudOperations<MaterialRow> = {
  list: async ({ page, pageSize, keyword, sort }) => {
    const result = await AdminApi.materials.list({
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
  delete: id => AdminApi.materials.delete(Number(id)),
}

export function MaterialsTable() {
  const t = useTypedTranslations()
  const router = useRouter()
  const [categories, setCategories] = useState<MaterialCategoryOption[]>([])
  const handle = useCrudTable<MaterialRow>({
    operations,
    getRowId: row => row.id,
    syncUrl: true,
  })

  useEffect(() => {
    let mounted = true

    AdminApi.materialCategories.active().then((result) => {
      if (mounted && result.code === 0)
        setCategories((result.data ?? []) as MaterialCategoryOption[])
    })

    return () => {
      mounted = false
    }
  }, [])

  const handleExport = () => {
    window.location.href = AdminApi.materials.exportUrl({
      keyword: handle.keyword,
      dir: handle.sort?.direction,
    })
  }

  const getCategoryLabel = (slug: string) => {
    const category = categories.find(item => item.slug === slug)
    return category?.name ?? slug
  }

  const columns: ColumnDef<MaterialRow>[] = [
    { key: 'id', label: 'ID', isRowHeader: true, width: 90, render: row => <CopyText>{row.id}</CopyText> },
    { key: 'title', label: t('common.admin.materials.columns.title'), sortable: true },
    { key: 'category', label: t('common.admin.materials.columns.category'), render: row => getCategoryLabel(row.category) },
    {
      key: 'fileName',
      label: t('common.admin.materials.columns.file'),
      render: row => row.fileName || '-',
    },
    {
      key: 'fileSize',
      label: t('common.admin.materials.columns.size'),
      render: row => row.fileSize > 0 ? `${Math.max(row.fileSize / 1024, 1).toFixed(1)} KB` : '-',
    },
    {
      key: 'status',
      label: t('common.admin.materials.columns.status'),
      render: row => (
        <Chip color={row.status === 'published' ? 'success' : row.status === 'draft' ? 'warning' : 'default'} size="sm" variant="soft">
          {t(`common.admin.status.${row.status}` as any)}
        </Chip>
      ),
    },
    {
      key: 'createdAt',
      label: t('common.admin.materials.columns.createdAt'),
      render: row => new Date(row.createdAt).toLocaleString(),
    },
  ]

  return (
    <CrudTable columns={columns} handle={handle}>
      <CrudTable.Toolbar
        createLabel={t('common.admin.materials.actions.create')}
        labels={{
          export: t('common.admin.crud.export'),
          refresh: t('common.admin.crud.refresh'),
          filters: t('common.admin.crud.filters'),
          openFilters: t('common.admin.crud.openFilters'),
          closeFilters: t('common.admin.crud.closeFilters'),
          deleteSelected: t('common.admin.crud.deleteSelected'),
        }}
        onCreate={() => router.push('/admin/materials/add')}
        onExport={handleExport}
        showExport
      />
      <CrudTable.Content
        aria-label={t('common.admin.pages.materials.title')}
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
        renderActions={({ rowId }) => (
          <Button isIconOnly onPress={() => router.push(`/admin/materials/${rowId}`)} size="sm" variant="tertiary">
            <Pencil size={14} />
          </Button>
        )}
        renderDetail={(row) => {
          const material = row as MaterialRow

          return (
            <div className="grid gap-4 text-sm leading-6">
              {material.coverKey && (
                <div>
                  <p className="font-medium text-foreground">{t('common.admin.materials.form.cover')}</p>
                  <p className="mt-1 text-muted">{t('common.admin.materials.form.uploaded')}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">{t('common.admin.materials.columns.summary')}</p>
                <p className="mt-1 text-muted">{material.summary}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t('common.admin.materials.columns.content')}</p>
                <p className="mt-1 whitespace-pre-wrap text-muted">{material.content}</p>
              </div>
              {material.fileKey && (
                <div>
                  <p className="font-medium text-foreground">{t('common.admin.materials.form.attachment')}</p>
                  <p className="mt-1 text-muted">{material.fileName ?? t('common.admin.materials.form.uploaded')}</p>
                </div>
              )}
            </div>
          )
        }}
      />
    </CrudTable>
  )
}

'use client'

import type { ColumnDef, CrudOperations } from '~/components/crud'
import type { MaterialCategoryInput } from '~/shared/schemas/content.schema'
import { Chip, FieldError, Input, Label, ListBox, Select, TextField } from '@heroui/react'
import { Controller } from 'react-hook-form'
import { AdminApi } from '~/apis/admin'
import { CrudTable } from '~/components/crud'
import { CopyText } from '~/components/feedback/CopyText'
import { useCrudTable } from '~/hooks/useCrudTable'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'
import { materialCategorySchema } from '~/shared/schemas/content.schema'
import { createZodI18nResolver } from '~/utils/zod-form-resolver'

interface MaterialCategoryRow {
  id: number
  name: string
  slug: string
  description: string | null
  status: number
  createdAt: string
}

const operations: CrudOperations<MaterialCategoryRow, MaterialCategoryInput, Partial<MaterialCategoryInput>> = {
  list: async ({ page, pageSize, keyword, sort }) => {
    const result = await AdminApi.materialCategories.list({
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
  create: data => AdminApi.materialCategories.create(data),
  update: (id, data) => AdminApi.materialCategories.update(Number(id), data),
  delete: id => AdminApi.materialCategories.delete(Number(id)),
}

export function MaterialCategoriesTable() {
  const t = useTypedTranslations()
  const handle = useCrudTable<MaterialCategoryRow, MaterialCategoryInput, Partial<MaterialCategoryInput>>({
    operations,
    getRowId: row => row.id,
    syncUrl: true,
  })
  const fieldLabels = {
    form: t('common.admin.formErrors.fields.form'),
    name: t('common.admin.materialCategories.form.name'),
    slug: t('common.admin.materialCategories.form.slug'),
    description: t('common.admin.materialCategories.form.description'),
    status: t('common.admin.materialCategories.form.status'),
  }

  const columns: ColumnDef<MaterialCategoryRow>[] = [
    { key: 'id', label: 'ID', isRowHeader: true, width: 90, render: row => <CopyText>{row.id}</CopyText> },
    { key: 'name', label: t('common.admin.materialCategories.columns.name'), sortable: true },
    { key: 'slug', label: t('common.admin.materialCategories.columns.slug') },
    { key: 'description', label: t('common.admin.materialCategories.columns.description') },
    {
      key: 'status',
      label: t('common.admin.materialCategories.columns.status'),
      render: row => (
        <Chip color={row.status === 1 ? 'success' : 'danger'} size="sm" variant="soft">
          {row.status === 1 ? t('common.admin.status.active') : t('common.admin.status.disabled')}
        </Chip>
      ),
    },
    {
      key: 'createdAt',
      label: t('common.admin.materialCategories.columns.createdAt'),
      render: row => new Date(row.createdAt).toLocaleString(),
    },
  ]

  return (
    <CrudTable columns={columns} handle={handle}>
      <CrudTable.Toolbar
        createLabel={t('common.admin.materialCategories.actions.create')}
        labels={{
          refresh: t('common.admin.crud.refresh'),
        }}
      />
      <CrudTable.Content
        aria-label={t('common.admin.pages.materialCategories.title')}
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
      <CrudTable.FormModal
        cancelLabel={t('common.admin.crud.cancel')}
        createSubmitLabel={t('common.admin.crud.create')}
        createTitle={t('common.admin.materialCategories.form.createTitle')}
        editSubmitLabel={t('common.admin.crud.save')}
        editTitle={t('common.admin.materialCategories.form.editTitle')}
        fieldLabels={fieldLabels}
        handle={handle}
        resolver={createZodI18nResolver(materialCategorySchema, t, fieldLabels)}
      >
        {({ data, form }) => (
          <>
            <TextField defaultValue={data?.name ?? ''} fullWidth isInvalid={!!form.formState.errors.name} isRequired>
              <Label>{t('common.admin.materialCategories.form.name')}</Label>
              <Input {...form.register('name')} variant="secondary" />
              <FieldError>{form.formState.errors.name?.message as string}</FieldError>
            </TextField>
            <TextField defaultValue={data?.slug ?? ''} fullWidth isInvalid={!!form.formState.errors.slug} isRequired>
              <Label>{t('common.admin.materialCategories.form.slug')}</Label>
              <Input {...form.register('slug')} variant="secondary" />
              <FieldError>{form.formState.errors.slug?.message as string}</FieldError>
            </TextField>
            <TextField defaultValue={data?.description ?? ''} fullWidth>
              <Label>{t('common.admin.materialCategories.form.description')}</Label>
              <Input {...form.register('description')} variant="secondary" />
            </TextField>
            <Controller
              control={form.control}
              defaultValue={data?.status ?? 1}
              name="status"
              render={({ field }) => (
                <Select fullWidth onChange={value => field.onChange(Number(value))} value={String(field.value)} variant="secondary">
                  <Label>{t('common.admin.materialCategories.form.status')}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="1" textValue={t('common.admin.status.active')}>{t('common.admin.status.active')}</ListBox.Item>
                      <ListBox.Item id="2" textValue={t('common.admin.status.disabled')}>{t('common.admin.status.disabled')}</ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              )}
            />
          </>
        )}
      </CrudTable.FormModal>
    </CrudTable>
  )
}

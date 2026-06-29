'use client'

import type { ColumnDef, CrudOperations } from '~/components/crud'
import type { SensitiveWordInput } from '~/shared/schemas/content.schema'
import { Chip, FieldError, Input, Label, ListBox, Select, TextField } from '@heroui/react'
import { Controller } from 'react-hook-form'
import { AdminApi } from '~/apis/admin'
import { CrudTable } from '~/components/crud'
import { CopyText } from '~/components/feedback/CopyText'
import { useCrudTable } from '~/hooks/useCrudTable'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'
import { sensitiveWordSchema } from '~/shared/schemas/content.schema'
import { createZodI18nResolver } from '~/utils/zod-form-resolver'

interface SensitiveWordRow {
  id: number
  word: string
  severity: 'low' | 'medium' | 'high'
  note: string | null
  status: number
  createdAt: string
}

const operations: CrudOperations<SensitiveWordRow, SensitiveWordInput, Partial<SensitiveWordInput>> = {
  list: async ({ page, pageSize, keyword, sort }) => {
    const result = await AdminApi.sensitiveWords.list({
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
  create: data => AdminApi.sensitiveWords.create(data),
  update: (id, data) => AdminApi.sensitiveWords.update(Number(id), data),
  delete: id => AdminApi.sensitiveWords.delete(Number(id)),
}

export function SensitiveWordsTable() {
  const t = useTypedTranslations()
  const handle = useCrudTable<SensitiveWordRow, SensitiveWordInput, Partial<SensitiveWordInput>>({
    operations,
    getRowId: row => row.id,
    syncUrl: true,
  })
  const fieldLabels = {
    form: t('common.admin.formErrors.fields.form'),
    word: t('common.admin.sensitiveWords.form.word'),
    severity: t('common.admin.sensitiveWords.form.severity'),
    status: t('common.admin.sensitiveWords.form.status'),
    note: t('common.admin.sensitiveWords.form.note'),
  }

  const columns: ColumnDef<SensitiveWordRow>[] = [
    { key: 'id', label: 'ID', isRowHeader: true, width: 90, render: row => <CopyText>{row.id}</CopyText> },
    { key: 'word', label: t('common.admin.sensitiveWords.columns.word'), sortable: true },
    {
      key: 'severity',
      label: t('common.admin.sensitiveWords.columns.severity'),
      render: row => (
        <Chip color={row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'success'} size="sm" variant="soft">
          {t(`common.admin.sensitiveWords.severity.${row.severity}` as any)}
        </Chip>
      ),
    },
    {
      key: 'status',
      label: t('common.admin.sensitiveWords.columns.status'),
      render: row => (
        <Chip color={row.status === 1 ? 'success' : 'danger'} size="sm" variant="soft">
          {row.status === 1 ? t('common.admin.status.active') : t('common.admin.status.disabled')}
        </Chip>
      ),
    },
    { key: 'note', label: t('common.admin.sensitiveWords.columns.note') },
    {
      key: 'createdAt',
      label: t('common.admin.sensitiveWords.columns.createdAt'),
      render: row => new Date(row.createdAt).toLocaleString(),
    },
  ]

  return (
    <CrudTable columns={columns} handle={handle}>
      <CrudTable.Toolbar
        createLabel={t('common.admin.sensitiveWords.actions.create')}
        labels={{
          export: t('common.admin.crud.export'),
          refresh: t('common.admin.crud.refresh'),
        }}
        showExport
      />
      <CrudTable.Content
        aria-label={t('common.admin.pages.sensitiveWords.title')}
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
        createTitle={t('common.admin.sensitiveWords.form.createTitle')}
        editSubmitLabel={t('common.admin.crud.save')}
        editTitle={t('common.admin.sensitiveWords.form.editTitle')}
        fieldLabels={fieldLabels}
        handle={handle}
        resolver={createZodI18nResolver(sensitiveWordSchema, t, fieldLabels)}
      >
        {({ data, form }) => (
          <>
            <TextField defaultValue={data?.word ?? ''} fullWidth isInvalid={!!form.formState.errors.word} isRequired>
              <Label>{t('common.admin.sensitiveWords.form.word')}</Label>
              <Input {...form.register('word')} variant="secondary" />
              <FieldError>{form.formState.errors.word?.message as string}</FieldError>
            </TextField>
            <Controller
              control={form.control}
              defaultValue={data?.severity ?? 'medium'}
              name="severity"
              render={({ field }) => (
                <Select fullWidth onChange={value => field.onChange(value)} value={field.value} variant="secondary">
                  <Label>{t('common.admin.sensitiveWords.form.severity')}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="low" textValue={t('common.admin.sensitiveWords.severity.low')}>{t('common.admin.sensitiveWords.severity.low')}</ListBox.Item>
                      <ListBox.Item id="medium" textValue={t('common.admin.sensitiveWords.severity.medium')}>{t('common.admin.sensitiveWords.severity.medium')}</ListBox.Item>
                      <ListBox.Item id="high" textValue={t('common.admin.sensitiveWords.severity.high')}>{t('common.admin.sensitiveWords.severity.high')}</ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              )}
            />
            <Controller
              control={form.control}
              defaultValue={data?.status ?? 1}
              name="status"
              render={({ field }) => (
                <Select fullWidth onChange={value => field.onChange(Number(value))} value={String(field.value)} variant="secondary">
                  <Label>{t('common.admin.sensitiveWords.form.status')}</Label>
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
            <TextField defaultValue={data?.note ?? ''} fullWidth>
              <Label>{t('common.admin.sensitiveWords.form.note')}</Label>
              <Input {...form.register('note')} variant="secondary" />
            </TextField>
          </>
        )}
      </CrudTable.FormModal>
    </CrudTable>
  )
}

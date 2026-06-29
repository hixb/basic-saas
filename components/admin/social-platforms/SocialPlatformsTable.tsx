'use client'

import type { ColumnDef, CrudOperations } from '~/components/crud'
import type { SocialPlatformConfigInput } from '~/shared/schemas/social-platform.schema'
import { Chip, FieldError, Input, Label, ListBox, Select, TextField } from '@heroui/react'
import { Controller } from 'react-hook-form'
import { AdminApi } from '~/apis/admin'
import { CrudTable } from '~/components/crud'
import { CopyText } from '~/components/feedback/CopyText'
import { useCrudTable } from '~/hooks/useCrudTable'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'
import { socialPlatformConfigSchema } from '~/shared/schemas/social-platform.schema'
import { createZodI18nResolver } from '~/utils/zod-form-resolver'

interface SocialPlatformRow {
  id: number
  platform: 'facebook' | 'youtube' | 'tiktok'
  displayName: string
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  apiBaseUrl: string
  publishEndpoint: string | null
  uploadEndpoint: string | null
  scopes: string
  status: number
  createdAt: string
}

const operations: CrudOperations<SocialPlatformRow, SocialPlatformConfigInput, Partial<SocialPlatformConfigInput>> = {
  list: async ({ page, pageSize, keyword, sort }) => {
    const result = await AdminApi.socialPlatforms.list({
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
  create: data => AdminApi.socialPlatforms.create(data),
  update: (id, data) => AdminApi.socialPlatforms.update(Number(id), data),
  delete: id => AdminApi.socialPlatforms.delete(Number(id)),
}

export function SocialPlatformsTable() {
  const t = useTypedTranslations()
  const handle = useCrudTable<SocialPlatformRow, SocialPlatformConfigInput, Partial<SocialPlatformConfigInput>>({
    operations,
    getRowId: row => row.id,
    syncUrl: true,
  })
  const fieldLabels = {
    form: t('common.admin.formErrors.fields.form'),
    platform: t('common.admin.socialPlatforms.form.platform'),
    displayName: t('common.admin.socialPlatforms.form.displayName'),
    clientId: t('common.admin.socialPlatforms.form.clientId'),
    clientSecret: t('common.admin.socialPlatforms.form.clientSecret'),
    authUrl: t('common.admin.socialPlatforms.form.authUrl'),
    tokenUrl: t('common.admin.socialPlatforms.form.tokenUrl'),
    apiBaseUrl: t('common.admin.socialPlatforms.form.apiBaseUrl'),
    publishEndpoint: t('common.admin.socialPlatforms.form.publishEndpoint'),
    uploadEndpoint: t('common.admin.socialPlatforms.form.uploadEndpoint'),
    scopes: t('common.admin.socialPlatforms.form.scopes'),
    status: t('common.admin.socialPlatforms.form.status'),
  }

  const columns: ColumnDef<SocialPlatformRow>[] = [
    { key: 'id', label: 'ID', isRowHeader: true, width: 90, render: row => <CopyText>{row.id}</CopyText> },
    {
      key: 'platform',
      label: t('common.admin.socialPlatforms.columns.platform'),
      render: row => t(`common.admin.socialPlatforms.platforms.${row.platform}` as any),
      sortable: true,
    },
    { key: 'displayName', label: t('common.admin.socialPlatforms.columns.displayName') },
    {
      key: 'apiBaseUrl',
      label: t('common.admin.socialPlatforms.columns.apiBaseUrl'),
      render: row => <span className="block max-w-72 truncate">{row.apiBaseUrl}</span>,
    },
    {
      key: 'status',
      label: t('common.admin.socialPlatforms.columns.status'),
      render: row => (
        <Chip color={row.status === 1 ? 'success' : 'danger'} size="sm" variant="soft">
          {row.status === 1 ? t('common.admin.status.active') : t('common.admin.status.disabled')}
        </Chip>
      ),
    },
    {
      key: 'createdAt',
      label: t('common.admin.socialPlatforms.columns.createdAt'),
      render: row => new Date(row.createdAt).toLocaleString(),
    },
  ]

  return (
    <CrudTable columns={columns} handle={handle}>
      <CrudTable.Toolbar
        createLabel={t('common.admin.socialPlatforms.actions.create')}
        labels={{
          refresh: t('common.admin.crud.refresh'),
        }}
      />
      <CrudTable.Content
        aria-label={t('common.admin.pages.socialPlatforms.title')}
        expandable
        labels={{
          actions: t('common.admin.crud.actions'),
          noResults: t('common.admin.crud.noResults'),
          pageSummary: ({ start, end, total }) => t('common.admin.crud.pageSummary', { start, end, total }),
          previous: t('common.admin.crud.previous'),
          rowsPerPage: t('common.admin.crud.rowsPerPage'),
          next: t('common.admin.crud.next'),
          selectAll: t('common.admin.crud.selectAll'),
          selectRow: t('common.admin.crud.selectRow'),
        }}
        renderDetail={(row) => {
          const platform = row as SocialPlatformRow

          return (
            <div className="grid gap-4 text-sm leading-6 md:grid-cols-2">
              <div>
                <p className="font-medium text-foreground">{t('common.admin.socialPlatforms.form.authUrl')}</p>
                <p className="mt-1 break-all text-muted">{platform.authUrl}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t('common.admin.socialPlatforms.form.tokenUrl')}</p>
                <p className="mt-1 break-all text-muted">{platform.tokenUrl}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t('common.admin.socialPlatforms.form.publishEndpoint')}</p>
                <p className="mt-1 break-all text-muted">{platform.publishEndpoint || '-'}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{t('common.admin.socialPlatforms.form.uploadEndpoint')}</p>
                <p className="mt-1 break-all text-muted">{platform.uploadEndpoint || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium text-foreground">{t('common.admin.socialPlatforms.form.scopes')}</p>
                <p className="mt-1 whitespace-pre-wrap text-muted">{platform.scopes || '-'}</p>
              </div>
            </div>
          )
        }}
      />
      <CrudTable.FormModal
        cancelLabel={t('common.admin.crud.cancel')}
        createSubmitLabel={t('common.admin.crud.create')}
        createTitle={t('common.admin.socialPlatforms.form.createTitle')}
        editSubmitLabel={t('common.admin.crud.save')}
        editTitle={t('common.admin.socialPlatforms.form.editTitle')}
        fieldLabels={fieldLabels}
        formClassName="grid grid-cols-2"
        handle={handle}
        resolver={createZodI18nResolver(socialPlatformConfigSchema, t, fieldLabels)}
        size="lg"
      >
        {({ data, form }) => (
          <>
            <Controller
              control={form.control}
              defaultValue={data?.platform ?? 'facebook'}
              name="platform"
              render={({ field }) => (
                <Select fullWidth onChange={value => field.onChange(value)} value={field.value} variant="secondary">
                  <Label>{t('common.admin.socialPlatforms.form.platform')}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="facebook" textValue="Facebook">{t('common.admin.socialPlatforms.platforms.facebook')}</ListBox.Item>
                      <ListBox.Item id="youtube" textValue="YouTube">{t('common.admin.socialPlatforms.platforms.youtube')}</ListBox.Item>
                      <ListBox.Item id="tiktok" textValue="TikTok">{t('common.admin.socialPlatforms.platforms.tiktok')}</ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              )}
            />
            <TextField defaultValue={data?.displayName ?? ''} fullWidth isInvalid={!!form.formState.errors.displayName} isRequired>
              <Label>{t('common.admin.socialPlatforms.form.displayName')}</Label>
              <Input {...form.register('displayName')} variant="secondary" />
              <FieldError>{form.formState.errors.displayName?.message as string}</FieldError>
            </TextField>
            <TextField defaultValue={data?.clientId ?? ''} fullWidth isInvalid={!!form.formState.errors.clientId} isRequired>
              <Label>{t('common.admin.socialPlatforms.form.clientId')}</Label>
              <Input {...form.register('clientId')} variant="secondary" />
              <FieldError>{form.formState.errors.clientId?.message as string}</FieldError>
            </TextField>
            <TextField defaultValue={data?.clientSecret ?? ''} fullWidth isInvalid={!!form.formState.errors.clientSecret} isRequired>
              <Label>{t('common.admin.socialPlatforms.form.clientSecret')}</Label>
              <Input {...form.register('clientSecret')} type="password" variant="secondary" />
              <FieldError>{form.formState.errors.clientSecret?.message as string}</FieldError>
            </TextField>
            <TextField defaultValue={data?.authUrl ?? ''} fullWidth isInvalid={!!form.formState.errors.authUrl} isRequired>
              <Label>{t('common.admin.socialPlatforms.form.authUrl')}</Label>
              <Input {...form.register('authUrl')} variant="secondary" />
              <FieldError>{form.formState.errors.authUrl?.message as string}</FieldError>
            </TextField>
            <TextField defaultValue={data?.tokenUrl ?? ''} fullWidth isInvalid={!!form.formState.errors.tokenUrl} isRequired>
              <Label>{t('common.admin.socialPlatforms.form.tokenUrl')}</Label>
              <Input {...form.register('tokenUrl')} variant="secondary" />
              <FieldError>{form.formState.errors.tokenUrl?.message as string}</FieldError>
            </TextField>
            <TextField defaultValue={data?.apiBaseUrl ?? ''} fullWidth isInvalid={!!form.formState.errors.apiBaseUrl} isRequired>
              <Label>{t('common.admin.socialPlatforms.form.apiBaseUrl')}</Label>
              <Input {...form.register('apiBaseUrl')} variant="secondary" />
              <FieldError>{form.formState.errors.apiBaseUrl?.message as string}</FieldError>
            </TextField>
            <TextField defaultValue={data?.publishEndpoint ?? ''} fullWidth>
              <Label>{t('common.admin.socialPlatforms.form.publishEndpoint')}</Label>
              <Input {...form.register('publishEndpoint')} variant="secondary" />
            </TextField>
            <TextField defaultValue={data?.uploadEndpoint ?? ''} fullWidth>
              <Label>{t('common.admin.socialPlatforms.form.uploadEndpoint')}</Label>
              <Input {...form.register('uploadEndpoint')} variant="secondary" />
            </TextField>
            <TextField defaultValue={data?.scopes ?? ''} fullWidth>
              <Label>{t('common.admin.socialPlatforms.form.scopes')}</Label>
              <Input {...form.register('scopes')} variant="secondary" />
            </TextField>
            <Controller
              control={form.control}
              defaultValue={data?.status ?? 1}
              name="status"
              render={({ field }) => (
                <Select fullWidth onChange={value => field.onChange(Number(value))} value={String(field.value)} variant="secondary">
                  <Label>{t('common.admin.socialPlatforms.form.status')}</Label>
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

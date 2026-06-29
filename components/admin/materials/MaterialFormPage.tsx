'use client'

import type { CreateMaterialInput } from '~/shared/schemas/content.schema'
import { Button, Card, Chip, FieldError, Form, Input, Label, ListBox, Select, TextArea, TextField, toast } from '@heroui/react'
import { ArrowLeft, FileText, ImageIcon, Loader2, Save, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { AdminApi } from '~/apis/admin'
import { MarkdownMaterialEditor } from '~/components/admin/materials/MarkdownMaterialEditor'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'
import { createMaterialSchema } from '~/shared/schemas/content.schema'
import { ensureApiSuccess } from '~/utils/api-response-error'
import { createZodI18nResolver, getAdminSubmitErrorMessage } from '~/utils/zod-form-resolver'

interface MaterialCategoryOption {
  id: number
  name: string
  slug: string
}

interface MaterialFormRecord extends CreateMaterialInput {
  id?: number
  coverUrl?: string | null
  fileUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

interface MaterialFormPageProps {
  mode: 'create' | 'edit'
  materialId?: number
}

const emptyDefaults: CreateMaterialInput = {
  title: '',
  summary: '',
  category: '',
  content: '',
  coverKey: '',
  fileName: '',
  fileSize: 0,
  fileKey: '',
  fileContentType: '',
  status: 'draft',
}

function mapMaterialToDefaults(material?: MaterialFormRecord | null): CreateMaterialInput {
  if (!material)
    return emptyDefaults

  return {
    title: material.title ?? '',
    summary: material.summary ?? '',
    category: material.category ?? '',
    content: material.content ?? '',
    coverKey: material.coverKey ?? '',
    fileName: material.fileName ?? '',
    fileSize: material.fileSize ?? 0,
    fileKey: material.fileKey ?? '',
    fileContentType: material.fileContentType ?? '',
    status: material.status ?? 'draft',
  }
}

function formatFileSize(size: number) {
  if (!size)
    return ''

  if (size < 1024 * 1024)
    return `${Math.max(size / 1024, 1).toFixed(1)} KB`

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function MaterialFormPage({ mode, materialId }: MaterialFormPageProps) {
  const t = useTypedTranslations()
  const router = useRouter()
  const [categories, setCategories] = useState<MaterialCategoryOption[]>([])
  const [material, setMaterial] = useState<MaterialFormRecord | null>(null)
  const [loading, setLoading] = useState(mode === 'edit')
  const [submitPending, setSubmitPending] = useState(false)
  const [uploading, setUploading] = useState<'cover' | 'file' | null>(null)
  const [loadError, setLoadError] = useState('')
  const [uploadPreview, setUploadPreview] = useState({
    coverUrl: '',
    fileName: '',
  })

  const fieldLabels = useMemo(() => ({
    form: t('common.admin.formErrors.fields.form'),
    title: t('common.admin.materials.form.title'),
    summary: t('common.admin.materials.form.summary'),
    category: t('common.admin.materials.form.category'),
    content: t('common.admin.materials.form.content'),
    coverKey: t('common.admin.materials.form.cover'),
    fileName: t('common.admin.materials.form.attachment'),
    fileSize: t('common.admin.materials.form.attachment'),
    fileKey: t('common.admin.materials.form.attachment'),
    fileContentType: t('common.admin.materials.form.attachment'),
    status: t('common.admin.materials.form.status'),
  }), [t])

  const form = useForm<CreateMaterialInput>({
    defaultValues: emptyDefaults,
    mode: 'onChange',
    resolver: createZodI18nResolver(createMaterialSchema, t, fieldLabels),
  })
  const { getValues, reset, setValue } = form
  const loadFailedMessage = t('common.admin.materials.editor.loadFailed')

  useEffect(() => {
    let mounted = true

    AdminApi.materialCategories.active().then((result) => {
      if (!mounted || result.code !== 0)
        return

      const items = (result.data ?? []) as MaterialCategoryOption[]
      setCategories(items)

      if (mode === 'create' && items[0] && !getValues('category')) {
        setValue('category', items[0].slug, {
          shouldDirty: false,
          shouldValidate: true,
        })
      }
    })

    return () => {
      mounted = false
    }
  }, [getValues, mode, setValue])

  useEffect(() => {
    if (mode !== 'edit' || !materialId)
      return

    let mounted = true
    setLoading(true)
    setLoadError('')

    AdminApi.materials.get(materialId)
      .then((result) => {
        if (!mounted)
          return

        if (result.code !== 0 || !result.data) {
          setLoadError(result.message || loadFailedMessage)
          return
        }

        const nextMaterial = result.data as MaterialFormRecord
        setMaterial(nextMaterial)
        reset(mapMaterialToDefaults(nextMaterial))
        setUploadPreview({
          coverUrl: nextMaterial.coverUrl ?? '',
          fileName: nextMaterial.fileName ?? '',
        })
      })
      .finally(() => {
        if (mounted)
          setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [loadFailedMessage, materialId, mode, reset])

  const watchedStatus = form.watch('status')
  const watchedCoverKey = form.watch('coverKey')
  const watchedFileName = form.watch('fileName')
  const watchedFileSize = form.watch('fileSize')
  const defaultCategory = categories[0]?.slug ?? ''
  const coverUrl = uploadPreview.coverUrl || material?.coverUrl || ''
  const fileName = uploadPreview.fileName || watchedFileName || material?.fileName || ''
  const pageTitle = mode === 'create'
    ? t('common.admin.materials.editor.createPageTitle')
    : t('common.admin.materials.editor.editPageTitle')

  const goBackToList = () => router.push('/admin/materials')

  const handleUpload = async (
    target: 'cover' | 'file',
    file: File | undefined,
    onUploaded: (data: { key: string, name: string, size: number, contentType: string, url: string }) => void,
  ) => {
    if (!file)
      return

    setUploading(target)
    const result = await AdminApi.materials.upload(file)
      .finally(() => setUploading(null))

    if (result.code !== 0 || !result.data) {
      toast.danger(t('common.admin.formErrors.unknown'))
      return
    }

    onUploaded(result.data)
    toast.success(t('common.admin.materials.form.uploaded'))
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitPending(true)

    try {
      if (mode === 'create') {
        ensureApiSuccess(await AdminApi.materials.create(data))
      }
      else if (materialId) {
        ensureApiSuccess(await AdminApi.materials.update(materialId, data))
      }

      toast.success(mode === 'create'
        ? t('common.admin.materials.editor.created')
        : t('common.admin.materials.editor.updated'))
      router.push('/admin/materials')
      router.refresh()
    }
    catch (error) {
      toast.danger(getAdminSubmitErrorMessage(error, t, fieldLabels))
    }
    finally {
      setSubmitPending(false)
    }
  })

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-lg border border-foreground/10 bg-surface-secondary">
        <div className="flex items-center gap-3 text-sm text-muted">
          <Loader2 className="size-5 animate-spin" />
          {t('common.admin.materials.editor.loading')}
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <Card>
        <Card.Content className="flex flex-col items-center justify-center gap-4 py-14 text-center">
          <div className="rounded-full bg-danger/10 p-3 text-danger">
            <FileText className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t('common.admin.materials.editor.loadFailed')}</h2>
            <p className="mt-1 text-sm text-muted">{loadError}</p>
          </div>
          <Button onPress={goBackToList} variant="secondary">
            <ArrowLeft className="size-4" />
            {t('common.admin.materials.editor.backToList')}
          </Button>
        </Card.Content>
      </Card>
    )
  }

  return (
    <Form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button isIconOnly onPress={goBackToList} size="sm" variant="tertiary">
            <ArrowLeft className="size-4" />
          </Button>
          <h2 className="truncate text-xl font-semibold text-foreground">{pageTitle}</h2>
          <Chip color={watchedStatus === 'published' ? 'success' : watchedStatus === 'draft' ? 'warning' : 'default'} size="sm" variant="soft">
            {t(`common.admin.status.${watchedStatus}` as any)}
          </Chip>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button onPress={goBackToList} size="sm" type="button" variant="tertiary">
            {t('common.admin.crud.cancel')}
          </Button>
          <Button isDisabled={submitPending} isPending={submitPending} size="sm" type="submit" variant="primary">
            <Save className="size-4" />
            {mode === 'create' ? t('common.admin.crud.create') : t('common.admin.crud.save')}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Card>
            <Card.Content className="space-y-3">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_150px]">
                <TextField fullWidth isInvalid={!!form.formState.errors.title} isRequired>
                  <Label>{t('common.admin.materials.form.title')}</Label>
                  <Input {...form.register('title')} variant="secondary" />
                  <FieldError>{form.formState.errors.title?.message as string}</FieldError>
                </TextField>
                <Controller
                  control={form.control}
                  defaultValue={defaultCategory}
                  name="category"
                  render={({ field }) => (
                    <Select
                      fullWidth
                      isInvalid={!!form.formState.errors.category}
                      onChange={(value) => {
                        field.onChange(value)
                        form.setValue('category', String(value), { shouldDirty: true, shouldValidate: true })
                      }}
                      selectedKey={field.value || defaultCategory || undefined}
                      value={field.value || defaultCategory}
                      variant="secondary"
                    >
                      <Label>{t('common.admin.materials.form.category')}</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {categories.map(category => (
                            <ListBox.Item id={category.slug} key={category.id} textValue={category.name}>
                              {category.name}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                      <FieldError>{form.formState.errors.category?.message as string}</FieldError>
                    </Select>
                  )}
                />
                <Controller
                  control={form.control}
                  defaultValue="draft"
                  name="status"
                  render={({ field }) => (
                    <Select
                      fullWidth
                      onChange={(value) => {
                        field.onChange(value)
                        form.setValue('status', value as CreateMaterialInput['status'], { shouldDirty: true, shouldValidate: true })
                      }}
                      selectedKey={field.value}
                      value={field.value}
                      variant="secondary"
                    >
                      <Label>{t('common.admin.materials.form.status')}</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="draft" textValue={t('common.admin.status.draft')}>{t('common.admin.status.draft')}</ListBox.Item>
                          <ListBox.Item id="published" textValue={t('common.admin.status.published')}>{t('common.admin.status.published')}</ListBox.Item>
                          <ListBox.Item id="archived" textValue={t('common.admin.status.archived')}>{t('common.admin.status.archived')}</ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                />
              </div>
              <TextField fullWidth isInvalid={!!form.formState.errors.summary} isRequired>
                <Label>{t('common.admin.materials.form.summary')}</Label>
                <TextArea {...form.register('summary')} rows={2} variant="secondary" />
                <FieldError>{form.formState.errors.summary?.message as string}</FieldError>
              </TextField>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content>
              <Controller
                control={form.control}
                defaultValue=""
                name="content"
                render={({ field }) => (
                  <MarkdownMaterialEditor
                    error={form.formState.errors.content?.message as string}
                    height={300}
                    onChange={(value) => {
                      field.onChange(value)
                      form.setValue('content', value, { shouldDirty: true, shouldValidate: true })
                    }}
                    value={field.value ?? ''}
                  />
                )}
              />
            </Card.Content>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <Card>
            <Card.Content className="space-y-3">
              <input type="hidden" {...form.register('coverKey')} />
              <input type="hidden" {...form.register('fileKey')} />
              <input type="hidden" {...form.register('fileName')} />
              <input type="hidden" {...form.register('fileSize', { valueAsNumber: true })} />
              <input type="hidden" {...form.register('fileContentType')} />

              <div className="rounded-lg border border-foreground/10 bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('common.admin.materials.form.cover')}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {watchedCoverKey ? t('common.admin.materials.form.uploaded') : t('common.admin.materials.form.noFile')}
                    </p>
                  </div>
                  <ImageIcon className="size-5 text-muted" />
                </div>
                {coverUrl && (
                  <img
                    alt={t('common.admin.materials.form.cover')}
                    className="mt-3 aspect-[16/10] w-full rounded-md object-cover"
                    src={coverUrl}
                  />
                )}
                <Button
                  className="mt-2 w-full"
                  isPending={uploading === 'cover'}
                  onPress={() => document.getElementById('material-page-cover-upload')?.click()}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Upload className="size-4" />
                  {t('common.admin.materials.form.uploadCover')}
                </Button>
                <input
                  accept="image/*"
                  className="hidden"
                  id="material-page-cover-upload"
                  onChange={(event) => {
                    const input = event.currentTarget
                    const file = input.files?.[0]

                    void handleUpload('cover', file, (uploaded) => {
                      form.setValue('coverKey', uploaded.key, { shouldDirty: true, shouldValidate: true })
                      setUploadPreview(prev => ({ ...prev, coverUrl: uploaded.url }))
                      input.value = ''
                    })
                  }}
                  type="file"
                />
              </div>

              <div className="rounded-lg border border-foreground/10 bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t('common.admin.materials.form.attachment')}</p>
                    <p className="mt-0.5 break-all text-xs text-muted">
                      {fileName || t('common.admin.materials.form.noFile')}
                    </p>
                    {!!watchedFileSize && (
                      <p className="mt-1 text-xs text-muted">{formatFileSize(watchedFileSize)}</p>
                    )}
                  </div>
                  <FileText className="size-5 text-muted" />
                </div>
                <Button
                  className="mt-2 w-full"
                  isPending={uploading === 'file'}
                  onPress={() => document.getElementById('material-page-file-upload')?.click()}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Upload className="size-4" />
                  {t('common.admin.materials.form.uploadFile')}
                </Button>
                <input
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip"
                  className="hidden"
                  id="material-page-file-upload"
                  onChange={(event) => {
                    const input = event.currentTarget
                    const file = input.files?.[0]

                    void handleUpload('file', file, (uploaded) => {
                      form.setValue('fileKey', uploaded.key, { shouldDirty: true, shouldValidate: true })
                      form.setValue('fileName', uploaded.name, { shouldDirty: true, shouldValidate: true })
                      form.setValue('fileSize', uploaded.size, { shouldDirty: true, shouldValidate: true })
                      form.setValue('fileContentType', uploaded.contentType, { shouldDirty: true, shouldValidate: true })
                      setUploadPreview(prev => ({ ...prev, fileName: uploaded.name }))
                      input.value = ''
                    })
                  }}
                  type="file"
                />
              </div>
            </Card.Content>
          </Card>
        </aside>
      </div>
    </Form>
  )
}

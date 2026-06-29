'use client'

import type { MaterialUploadResponse } from '~/apis/admin'
import { Button, toast } from '@heroui/react'
import MDEditor from '@uiw/react-md-editor'
import { FileUp, ImagePlus, Paperclip, Video } from 'lucide-react'
import { useRef, useState } from 'react'
import { AdminApi } from '~/apis/admin'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'

interface MarkdownMaterialEditorProps {
  error?: string
  height?: number
  onChange: (value: string) => void
  value: string
}

function buildMarkdownAsset(data: MaterialUploadResponse) {
  if (data.contentType.startsWith('image/'))
    return `![${data.name}](${data.url})`

  if (data.contentType.startsWith('video/')) {
    return `<video controls src="${data.url}" title="${data.name}"></video>`
  }

  return `[${data.name}](${data.url})`
}

export function MarkdownMaterialEditor({ value, error, height = 380, onChange }: MarkdownMaterialEditorProps) {
  const t = useTypedTranslations()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File | undefined) => {
    if (!file)
      return

    setUploading(true)
    const result = await AdminApi.materials.upload(file).finally(() => setUploading(false))

    if (result.code !== 0 || !result.data) {
      toast.danger(t('common.admin.formErrors.unknown'))
      return
    }

    const prefix = value.trim() ? '\n\n' : ''
    onChange(`${value}${prefix}${buildMarkdownAsset(result.data)}\n`)
    toast.success(t('common.admin.materials.form.uploaded'))

    if (fileRef.current)
      fileRef.current.value = ''
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{t('common.admin.materials.form.content')}</p>
        <Button
          isPending={uploading}
          onPress={() => fileRef.current?.click()}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Paperclip className="size-4" />
          {t('common.admin.materials.form.insertAsset')}
        </Button>
        <input
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip"
          className="hidden"
          onChange={event => handleUpload(event.currentTarget.files?.[0])}
          ref={fileRef}
          type="file"
        />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <ImagePlus className="size-3.5" />
          {t('common.admin.materials.form.markdownImages')}
        </span>
        <span className="inline-flex items-center gap-1">
          <Video className="size-3.5" />
          {t('common.admin.materials.form.markdownVideos')}
        </span>
        <span className="inline-flex items-center gap-1">
          <FileUp className="size-3.5" />
          {t('common.admin.materials.form.markdownFiles')}
        </span>
      </div>
      <div data-color-mode="light">
        <MDEditor
          height={height}
          onChange={nextValue => onChange(nextValue ?? '')}
          preview="edit"
          textareaProps={{ 'aria-label': t('common.admin.materials.form.content') }}
          value={value}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}

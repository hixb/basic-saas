'use client'

import type { SyntheticEvent } from 'react'
import type { ValidationErrorData, ValidationErrorReason } from '~/shared/types/api.type'
import { Button, FieldError, Form, InputGroup, Label, TextArea, TextField, toast } from '@heroui/react'
import { ArrowLeft, Boxes, CheckCircle2, PhoneCall } from 'lucide-react'
import { useTransition } from 'react'
import { AdminApi } from '~/apis/admin'
import { Link } from '~/components/navigation/Link'
import { LanguageSwitch } from '~/components/switcher/LanguageSwitch'
import { ThemeSwitch } from '~/components/switcher/ThemeSwitch'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'
import { createInquirySchema } from '~/shared/schemas/content.schema'
import { ResponseCode } from '~/shared/types/api.type'
import { mapValidationIssue } from '~/shared/utils/validation-error.util'

const inquiryFieldKeys = {
  contactName: 'common.contact.errors.fields.contactName',
  companyName: 'common.contact.errors.fields.companyName',
  email: 'common.contact.errors.fields.email',
  phone: 'common.contact.errors.fields.phone',
  description: 'common.contact.errors.fields.description',
} as const

function isValidationErrorData(data: unknown): data is ValidationErrorData {
  if (!data || typeof data !== 'object')
    return false

  return 'reason' in data && typeof data.reason === 'string'
}

function normalizeReason(reason?: string): ValidationErrorReason {
  if (
    reason === 'required'
    || reason === 'too_small'
    || reason === 'too_big'
    || reason === 'invalid_email'
    || reason === 'invalid_url'
    || reason === 'invalid_type'
    || reason === 'sensitive_content'
  ) {
    return reason
  }

  return 'unknown'
}

export default function ContactPageClient() {
  const t = useTypedTranslations()
  const [isPending, startTransition] = useTransition()

  const getFieldLabel = (field?: string) => {
    if (field && field in inquiryFieldKeys)
      return t(inquiryFieldKeys[field as keyof typeof inquiryFieldKeys])

    return t('common.contact.errors.fields.form')
  }

  const getValidationErrorMessage = (data?: ValidationErrorData) => {
    const field = getFieldLabel(data?.field)
    const reason = normalizeReason(data?.reason)

    if (reason === 'required' || reason === 'invalid_type')
      return t('common.contact.errors.required', { field })

    if (reason === 'too_small')
      return t('common.contact.errors.tooSmall', { field, min: data?.min ?? 1 })

    if (reason === 'too_big')
      return t('common.contact.errors.tooBig', { field, max: data?.max ?? 0 })

    if (reason === 'invalid_email')
      return t('common.contact.errors.invalidEmail')

    if (reason === 'invalid_url')
      return t('common.contact.errors.invalidUrl', { field })

    if (reason === 'sensitive_content')
      return t('common.contact.errors.sensitiveContent')

    return t('common.contact.errors.unknown')
  }

  const getSubmissionErrorMessage = (code: number, data: unknown) => {
    if (code === ResponseCode.SENSITIVE_CONTENT_DETECTED)
      return t('common.contact.errors.sensitiveContent')

    if (code === ResponseCode.INVALID_FORM_INPUT && isValidationErrorData(data))
      return getValidationErrorMessage(data)

    return t('common.contact.errors.unknown')
  }

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      contactName: String(formData.get('contactName') ?? ''),
      companyName: String(formData.get('companyName') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      description: String(formData.get('description') ?? ''),
    }

    const validation = createInquirySchema.safeParse(payload)
    if (!validation.success) {
      toast.danger(getValidationErrorMessage(mapValidationIssue(validation.error.issues[0])))
      return
    }

    startTransition(async () => {
      const result = await AdminApi.public.createInquiry(validation.data)
      if (result.code === ResponseCode.SUCCESS) {
        toast.success(t('common.home.form.success'))
      }
      else {
        toast.danger(getSubmissionErrorMessage(result.code, result.data))
      }
    })
  }

  return (
    <main className="min-h-dvh bg-[#073f4a] text-white dark:bg-[#062f38]">
      <header className="border-b border-black/8 bg-[#fbfaf6] text-[#1d1b17] dark:border-white/10 dark:bg-[#062f38] dark:text-[#f4efe7]">
        <div className="mx-auto flex h-14 max-w-[1380px] items-center justify-between px-5 lg:px-8">
          <Link className="flex items-center gap-2 text-sm font-semibold" href="/">
            <Boxes className="size-4" />
            {t('common.home.brand')}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <ThemeSwitch />
            <Link className="inline-flex items-center rounded-sm bg-[#b8462f] px-4 text-[12px] font-semibold text-white h-11" href="/admin/login">
              {t('common.home.nav.admin')}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-20">
        <aside className="overflow-hidden">
          <Link className="inline-flex items-center gap-2 text-sm text-white/62 hover:text-white" href="/">
            <ArrowLeft className="size-4" />
            {t('common.contact.back')}
          </Link>
          <h1 className="mt-10 max-w-xl font-serif text-5xl leading-[0.96] md:text-7xl">
            {t('common.contact.title')}
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/62">
            {t('common.contact.description')}
          </p>
          <div className="mt-10 grid gap-4">
            {['free', 'response', 'secure'].map(point => (
              <div className="flex gap-3 text-sm leading-6 text-white/72" key={point}>
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-white" />
                <span>{t(`common.home.form.points.${point}` as any)}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-xl bg-[#fbfaf6] p-5 text-[#1d1b17] shadow-2xl dark:bg-[#f4efe7] md:p-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#b8462f]">{t('common.home.form.eyebrow')}</p>
          <h2 className="mt-3 font-serif text-4xl">{t('common.home.form.title')}</h2>
          <Form className="mt-8 grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField isRequired name="contactName">
                <Label>{t('common.home.form.name')}</Label>
                <InputGroup>
                  <InputGroup.Input placeholder={t('common.contact.placeholders.contactName')} />
                </InputGroup>
                <FieldError />
              </TextField>
              <TextField isRequired name="companyName">
                <Label>{t('common.home.form.company')}</Label>
                <InputGroup>
                  <InputGroup.Input placeholder={t('common.contact.placeholders.companyName')} />
                </InputGroup>
                <FieldError />
              </TextField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField isRequired name="email" type="email">
                <Label>{t('common.home.form.email')}</Label>
                <InputGroup>
                  <InputGroup.Input placeholder="jane@example.com" />
                </InputGroup>
                <FieldError />
              </TextField>
              <TextField isRequired name="phone" type="tel">
                <Label>{t('common.home.form.phone')}</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <PhoneCall className="size-4 text-[#6f665e]" />
                  </InputGroup.Prefix>
                  <InputGroup.Input placeholder="+1 415 555 0198" />
                </InputGroup>
                <FieldError />
              </TextField>
            </div>
            <TextField isRequired name="description">
              <Label>{t('common.home.form.descriptionLabel')}</Label>
              <TextArea placeholder={t('common.home.form.descriptionPlaceholder')} rows={6} />
              <FieldError />
            </TextField>
            <Button className="h-11 w-full rounded-sm bg-[#b8462f] text-white" isPending={isPending} type="submit">
              {t('common.home.form.submit')}
            </Button>
          </Form>
        </section>
      </section>
    </main>
  )
}

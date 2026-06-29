'use client'

import type { SyntheticEvent } from 'react'
import type { ValidationErrorData, ValidationErrorReason } from '~/shared/types/api.type'
import { Button, FieldError, Form, InputGroup, Label, TextArea, TextField, toast } from '@heroui/react'
import { ArrowLeft, ArrowUpRight, Boxes, CheckCircle2, PhoneCall, Sparkles } from 'lucide-react'
import { useTransition } from 'react'
import { AdminApi } from '~/apis/admin'
import { Link } from '~/components/navigation/Link'
import { LanguageSwitch } from '~/components/switcher/LanguageSwitch'
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

const backgroundVideoUrl = 'https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8'

const reviewSteps = ['Channel intake', 'Document review', 'Launch roadmap']

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
    <main className="dark relative min-h-dvh overflow-hidden bg-black font-body text-white">
      <video
        autoPlay
        className="absolute inset-0 h-full w-full object-cover opacity-20 dark:opacity-45"
        loop
        muted
        playsInline
      >
        <source src={backgroundVideoUrl} />
      </video>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(92,161,255,0.16),transparent_32%),linear-gradient(180deg,rgba(246,248,251,0.55),#f6f8fb_86%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(92,161,255,0.22),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.42),#000_86%)]" />

      <header className="relative z-20 px-4 pt-4 lg:px-16">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4">
          <Link className="flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-4 py-2.5 text-sm font-semibold text-[#15171c] shadow-[0_18px_60px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white dark:shadow-none" href="/">
            <Boxes className="size-4" />
            {t('common.home.brand')}
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-2 py-1 shadow-[0_18px_60px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:shadow-none">
            <LanguageSwitch variant="frontend" />
            <Link className="hidden h-10 items-center rounded-full bg-white/12 px-3 text-xs font-semibold text-white sm:inline-flex" href="/admin/login">
              {t('common.home.nav.admin')}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-[1180px] gap-10 px-5 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-24">
        <aside className="overflow-hidden pt-8">
          <Link className="inline-flex items-center gap-2 text-sm text-[#5b6472] transition hover:text-[#15171c] dark:text-white/62 dark:hover:text-white" href="/">
            <ArrowLeft className="size-4" />
            {t('common.contact.back')}
          </Link>
          <div className="ml-2 mt-10 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-4 py-1.5 text-sm text-[#5b6472] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white/72">
            <Sparkles className="size-4" />
            {t('common.home.form.eyebrow')}
          </div>
          <h1 className="mt-7 max-w-xl font-heading text-6xl italic leading-[0.86] md:text-8xl">
            {t('common.contact.title')}
          </h1>
          <p className="mt-7 max-w-md text-base font-light leading-8 text-[#5b6472] dark:text-white/64">
            {t('common.contact.description')}
          </p>
          <div className="mt-10 grid gap-4">
            {['free', 'response', 'secure'].map(point => (
              <div className="flex gap-3 rounded-2xl border border-black/10 bg-white/55 px-4 py-3 text-sm leading-6 text-[#5b6472] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white/72" key={point}>
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#15171c] dark:text-white" />
                <span>{t(`common.home.form.points.${point}` as any)}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-black/10 text-center dark:bg-white/14">
            {reviewSteps.map(step => (
              <div className="bg-white/55 px-3 py-4 text-xs font-light text-[#5b6472] backdrop-blur-xl dark:bg-black/28 dark:text-white/62" key={step}>
                {step}
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl border border-black/10 bg-white/55 p-5 shadow-[0_30px_120px_rgba(16,24,40,0.1)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:shadow-black/30 md:p-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#5b6472] dark:text-white/48">{t('common.home.form.eyebrow')}</p>
          <h2 className="mt-3 font-heading text-5xl italic leading-none">{t('common.home.form.title')}</h2>
          <Form className="mt-8 grid gap-5" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField isRequired name="contactName">
                <Label className="text-[#5b6472] dark:text-white/72">{t('common.home.form.name')}</Label>
                <InputGroup className="rounded-2xl border border-black/10 bg-white/70 text-[#15171c] dark:border-white/12 dark:bg-white/8 dark:text-white">
                  <InputGroup.Input placeholder={t('common.contact.placeholders.contactName')} />
                </InputGroup>
                <FieldError />
              </TextField>
              <TextField isRequired name="companyName">
                <Label className="text-[#5b6472] dark:text-white/72">{t('common.home.form.company')}</Label>
                <InputGroup className="rounded-2xl border border-black/10 bg-white/70 text-[#15171c] dark:border-white/12 dark:bg-white/8 dark:text-white">
                  <InputGroup.Input placeholder={t('common.contact.placeholders.companyName')} />
                </InputGroup>
                <FieldError />
              </TextField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField isRequired name="email" type="email">
                <Label className="text-[#5b6472] dark:text-white/72">{t('common.home.form.email')}</Label>
                <InputGroup className="rounded-2xl border border-black/10 bg-white/70 text-[#15171c] dark:border-white/12 dark:bg-white/8 dark:text-white">
                  <InputGroup.Input placeholder="jane@example.com" />
                </InputGroup>
                <FieldError />
              </TextField>
              <TextField isRequired name="phone" type="tel">
                <Label className="text-[#5b6472] dark:text-white/72">{t('common.home.form.phone')}</Label>
                <InputGroup className="rounded-2xl border border-black/10 bg-white/70 text-[#15171c] dark:border-white/12 dark:bg-white/8 dark:text-white">
                  <InputGroup.Prefix>
                    <PhoneCall className="size-4 text-[#5b6472] dark:text-white/50" />
                  </InputGroup.Prefix>
                  <InputGroup.Input placeholder="+1 415 555 0198" />
                </InputGroup>
                <FieldError />
              </TextField>
            </div>
            <TextField isRequired name="description">
              <Label className="text-[#5b6472] dark:text-white/72">{t('common.home.form.descriptionLabel')}</Label>
              <TextArea className="min-h-40 rounded-2xl border border-black/10 bg-white/70 text-[#15171c] dark:border-white/12 dark:bg-white/8 dark:text-white" placeholder={t('common.home.form.descriptionPlaceholder')} rows={6} />
              <FieldError />
            </TextField>
            <Button className="liquid-glass-strong h-12 w-full rounded-full text-[#15171c] dark:text-white" isPending={isPending} type="submit">
              {t('common.home.form.submit')}
              <ArrowUpRight className="size-4" />
            </Button>
          </Form>
        </section>
      </section>
    </main>
  )
}

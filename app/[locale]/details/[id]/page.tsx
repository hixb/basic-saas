import type { Metadata } from 'next'
import type { ComponentType } from 'react'
import { ArrowLeft, ArrowUpRight, Boxes, CheckCircle2, Download, Globe2, PackageCheck, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import NextLink from 'next/link'
import { notFound } from 'next/navigation'
import { MarkdownRenderer } from '~/components/content/MarkdownRenderer'
import { LanguageSwitch } from '~/components/switcher/LanguageSwitch'
import { WEBSITE_CONFIG } from '~/config/website'
import { findPublicMaterialById } from '~/server/application/content/public-material.query'

interface MaterialDetailsPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

const insightIcons: ComponentType<{ className?: string }>[] = [ShieldCheck, PackageCheck, Globe2]
const fallbackCoverUrl = 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80'

function getLocalizedHref(locale: string, href: string) {
  if (locale === WEBSITE_CONFIG.i18n.defaultLocale)
    return href

  return `/${locale}${href}`
}

function parseMaterialId(id: string) {
  const materialId = Number.parseInt(id, 10)

  if (!Number.isInteger(materialId) || materialId <= 0)
    return null

  return materialId
}

export async function generateMetadata({ params }: MaterialDetailsPageProps): Promise<Metadata> {
  const { id } = await params
  const t = await getTranslations('common')
  const materialId = parseMaterialId(id)

  if (!materialId) {
    return {
      title: t('details.empty.title'),
    }
  }

  const material = await findPublicMaterialById(materialId)

  if (!material) {
    return {
      title: t('details.empty.title'),
    }
  }

  return {
    title: material.title,
    description: material.summary,
    openGraph: {
      title: material.title,
      description: material.summary,
      images: material.coverUrl ? [{ url: material.coverUrl, alt: material.title }] : undefined,
      type: 'article',
    },
    twitter: {
      card: material.coverUrl ? 'summary_large_image' : 'summary',
      title: material.title,
      description: material.summary,
      images: material.coverUrl ? [material.coverUrl] : undefined,
    },
  }
}

export default async function MaterialDetailsPage({ params }: MaterialDetailsPageProps) {
  const { locale, id } = await params
  const t = await getTranslations('common')
  const materialId = parseMaterialId(id)

  if (!materialId)
    notFound()

  const material = await findPublicMaterialById(materialId)

  if (!material)
    notFound()

  const homeHref = getLocalizedHref(locale, '/')
  const contactHref = getLocalizedHref(locale, '/contact')
  const resourcesHref = `${homeHref}#resources`
  const coverUrl = material.coverUrl || fallbackCoverUrl

  return (
    <main className="dark min-h-dvh bg-black font-body text-white">
      <header className="fixed left-0 right-0 top-4 z-50 px-4 lg:px-16">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4">
          <NextLink className="flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-4 py-2.5 text-sm font-semibold text-[#15171c] shadow-[0_18px_60px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white dark:shadow-none" href={homeHref}>
            <Boxes className="size-4" />
            {t('home.brand')}
          </NextLink>
          <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-2 py-1 shadow-[0_18px_60px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:shadow-none">
            <LanguageSwitch variant="frontend" />
            <NextLink className="hidden h-10 items-center rounded-full bg-white/12 px-3 text-xs font-semibold text-white sm:inline-flex" href={contactHref}>
              {t('home.nav.contact')}
            </NextLink>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 pb-20 pt-36 lg:px-8 lg:pb-24">
        <div className="absolute inset-0">
          <img
            alt=""
            className="size-full object-cover opacity-20 saturate-0 dark:opacity-40"
            src={coverUrl}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(92,161,255,0.16),transparent_34%),linear-gradient(180deg,rgba(246,248,251,0.48),#f6f8fb_88%)] dark:bg-[radial-gradient(circle_at_70%_20%,rgba(92,161,255,0.22),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.42),#000_88%)]" />
        </div>
        <div className="relative z-10 mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="pt-2">
            <NextLink className="inline-flex items-center gap-2 text-sm text-[#5b6472] transition hover:text-[#15171c] dark:text-white/68 dark:hover:text-white" href={resourcesHref}>
              <ArrowLeft className="size-4" />
              {t('details.back')}
            </NextLink>
            <div className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 text-center backdrop-blur-xl dark:border-white/20 dark:bg-white/14">
              {[0, 1, 2].map((index) => {
                const Icon = insightIcons[index]

                return (
                  <div className="bg-white/55 p-4 dark:bg-black/24" key={index}>
                    <Icon className="mx-auto size-5 text-[#15171c]/80 dark:text-white/86" />
                    <p className="mt-3 text-[11px] leading-5 text-[#5b6472] dark:text-white/64">{t(`details.insights.${index}` as any)}</p>
                  </div>
                )
              })}
            </div>
          </aside>
          <article>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#5b6472] dark:text-white/58">{t('details.eyebrow')}</p>
            <span className="mt-5 inline-flex h-8 items-center rounded-full border border-black/10 bg-white/55 px-4 text-xs font-medium backdrop-blur-xl dark:border-white/20 dark:bg-white/8">
              {material.categoryName}
            </span>
            <h1 className="mt-6 max-w-4xl font-heading text-6xl italic leading-[0.86] md:text-8xl">
              {material.title}
            </h1>
            <p className="mt-7 max-w-3xl text-base font-light leading-8 text-[#5b6472] dark:text-white/70">
              {material.summary}
            </p>
            {material.fileUrl && (
              <NextLink
                className="liquid-glass-strong mt-8 inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[#15171c] transition dark:text-white"
                href={material.fileUrl}
                target="_blank"
              >
                <Download className="size-4" />
                {t('details.download')}
                {material.fileName ? ` · ${material.fileName}` : ''}
                <ArrowUpRight className="size-4" />
              </NextLink>
            )}
          </article>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-2xl border border-black/10 bg-white/55 p-6 shadow-[0_24px_90px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:shadow-none lg:sticky lg:top-24">
            <p className="font-heading text-3xl italic leading-none">{t('details.sidebar.title')}</p>
            <div className="mt-5 space-y-4">
              {[
                t('details.sidebar.points.platform'),
                t('details.sidebar.points.fulfillment'),
                t('details.sidebar.points.compliance'),
              ].map(point => (
                <div className="flex gap-3 text-sm font-light leading-6 text-[#5b6472] dark:text-white/64" key={point}>
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#15171c] dark:text-white" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
            <NextLink className="liquid-glass-strong mt-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#15171c] dark:text-white" href={contactHref}>
              {t('home.nav.contact')}
              <ArrowUpRight className="size-4" />
            </NextLink>
          </aside>
          <article className="rounded-3xl border border-black/10 bg-white/55 p-5 shadow-[0_24px_90px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:shadow-none lg:p-8">
            <div className="relative mb-8 aspect-[2.05] max-h-[360px] w-full overflow-hidden rounded-2xl">
              <img
                alt={material.title}
                className="object-cover"
                src={coverUrl}
              />
            </div>
            <div className="rounded-2xl lg:p-8">
              <MarkdownRenderer content={material.content} />
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

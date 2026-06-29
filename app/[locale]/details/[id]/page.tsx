import type { Metadata } from 'next'
import type { ComponentType } from 'react'
import { ArrowLeft, Boxes, CheckCircle2, Download, Globe2, PackageCheck, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import NextLink from 'next/link'
import { notFound } from 'next/navigation'
import { MarkdownRenderer } from '~/components/content/MarkdownRenderer'
import { LanguageSwitch } from '~/components/switcher/LanguageSwitch'
import { ThemeSwitch } from '~/components/switcher/ThemeSwitch'
import { WEBSITE_CONFIG } from '~/config/website'
import { findPublicMaterialById } from '~/server/application/content/public-material.query'

interface MaterialDetailsPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

const insightIcons: ComponentType<{ className?: string }>[] = [ShieldCheck, PackageCheck, Globe2]

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

  return (
    <main className="min-h-dvh bg-[#fbfaf6] text-[#1d1b17] dark:bg-[#062f38] dark:text-[#f4efe7]">
      <header className="border-b border-black/8 bg-[#fbfaf6] dark:border-white/10 dark:bg-[#062f38]">
        <div className="mx-auto flex h-14 max-w-[1380px] items-center justify-between px-5 lg:px-8">
          <NextLink className="flex items-center gap-2 text-sm font-semibold" href={homeHref}>
            <Boxes className="size-4" />
            {t('home.brand')}
          </NextLink>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <ThemeSwitch />
            <NextLink className="inline-flex h-11 items-center rounded-sm bg-[#b8462f] px-4 text-[12px] font-semibold text-white" href={contactHref}>
              {t('home.nav.contact')}
            </NextLink>
          </div>
        </div>
      </header>

      <section className="bg-[#b8462f] px-5 py-12 text-white dark:bg-[#073f4a] lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <aside>
            <NextLink className="inline-flex items-center gap-2 text-sm text-white/68 hover:text-white" href={resourcesHref}>
              <ArrowLeft className="size-4" />
              {t('details.back')}
            </NextLink>
            <div className="mt-12 grid grid-cols-3 gap-px bg-white/14 text-center">
              {[0, 1, 2].map((index) => {
                const Icon = insightIcons[index]

                return (
                  <div className="bg-[#b8462f] p-4 dark:bg-[#073f4a]" key={index}>
                    <Icon className="mx-auto size-5 text-white/86" />
                    <p className="mt-3 text-[11px] leading-5 text-white/64">{t(`details.insights.${index}` as any)}</p>
                  </div>
                )
              })}
            </div>
          </aside>
          <article>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/58">{t('details.eyebrow')}</p>
            <span className="mt-5 inline-flex h-7 items-center rounded-full bg-white/16 px-3 text-xs font-medium text-white">
              {material.categoryName}
            </span>
            <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[0.98] md:text-7xl">
              {material.title}
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/72">
              {material.summary}
            </p>
            {material.fileUrl && (
              <NextLink
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-sm bg-white px-5 text-sm font-semibold text-[#b8462f] transition hover:bg-white/90 dark:text-[#073f4a]"
                href={material.fileUrl}
                target="_blank"
              >
                <Download className="size-4" />
                {t('details.download')}
                {material.fileName ? ` · ${material.fileName}` : ''}
              </NextLink>
            )}
          </article>
        </div>
      </section>

      <section className="bg-[#fbfaf6] px-5 py-16 dark:bg-[#f4efe7] dark:text-[#1d1b17] lg:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit border-t border-[#28231d]/10 pt-6 lg:sticky lg:top-20">
            <p className="font-serif text-2xl">{t('details.sidebar.title')}</p>
            <div className="mt-5 space-y-4">
              {[
                t('details.sidebar.points.platform'),
                t('details.sidebar.points.fulfillment'),
                t('details.sidebar.points.compliance'),
              ].map(point => (
                <div className="flex gap-3 text-sm leading-6 text-[#5f574f]" key={point}>
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#b8462f]" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </aside>
          <article className="rounded-lg bg-white p-5 shadow-xl shadow-black/5 lg:p-8">
            {material.coverUrl && (
              <img
                alt={material.title}
                className="mb-8 max-h-[320px] w-full rounded-lg object-cover"
                src={material.coverUrl}
              />
            )}
            <MarkdownRenderer content={material.content} />
          </article>
        </div>
      </section>
    </main>
  )
}

'use client'

import type { ComponentType } from 'react'
import { Chip } from '@heroui/react'
import { motion } from 'framer-motion'
import { ArrowUpRight, BarChart3, Boxes, CheckCircle2, ClipboardCheck, PackageCheck, Play, Route, Shield, Sparkles, Zap } from 'lucide-react'
import { Link } from '~/components/navigation/Link'
import { LanguageSwitch } from '~/components/switcher/LanguageSwitch'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'

interface PublicMaterial {
  id: number
  title: string
  summary: string
  category: string
  categoryName?: string
  coverUrl?: string | null
  createdAt: string
}

interface HomePageClientProps {
  materials: PublicMaterial[]
}

const heroVideoUrl = '/video/flower.mp4'
const startVideoUrl = '/video/dark-flow.m3u8'
const statsVideoUrl = '/video/dusk-flow.m3u8'
const ctaVideoUrl = '/video/dazzle-gold-flow.m3u8'

const fallbackImages = [
  '/static/photo-1586528116311-ad8dd3c8310d.jpeg',
  '/static/photo-1566576912321-d58ddd7a6088.jpeg',
  '/static/photo-1494412685616-a5d310fbb07d.jpeg',
]

const navLinks = [
  ['common.home.nav.platform', '#platform'],
  ['common.home.nav.specialties', '#specialties'],
  ['common.home.nav.insights', '#resources'],
  ['common.home.nav.contact', '/contact'],
]

const marketplaceNames = ['Amazon', 'Shopify', 'TikTok Shop', 'Walmart', 'DTC']

const metrics = [
  ['3M+', 'common.home.metrics.orders'],
  ['10x', 'common.home.metrics.countries'],
  ['34x', 'common.home.metrics.sla'],
  ['5 days', 'Average review cycle'],
]

const featureRows = [
  {
    titleKey: 'common.home.features.catalog.title',
    bodyKey: 'common.home.features.catalog.description',
    ctaKey: 'common.home.hero.secondary',
    image: '/static/photo-1552664730-d307ca884978.jpeg',
  },
  {
    titleKey: 'common.home.features.fulfillment.title',
    bodyKey: 'common.home.features.fulfillment.description',
    ctaKey: 'common.home.platform.cta',
    image: '/static/photo-1586528116311-ad8dd3c8310d.jpeg',
  },
]

const whyUs: Array<{
  icon: ComponentType<{ className?: string }>
  title: string
  bodyKey: string
}> = [
  {
    icon: Zap,
    title: 'Fast coordination',
    bodyKey: 'common.home.workflow.steps.connect.description',
  },
  {
    icon: ClipboardCheck,
    title: 'Structured review',
    bodyKey: 'common.home.workflow.steps.prepare.description',
  },
  {
    icon: BarChart3,
    title: 'Launch intelligence',
    bodyKey: 'common.home.workflow.steps.ship.description',
  },
  {
    icon: Shield,
    title: 'Sensitive screening',
    bodyKey: 'common.home.form.points.secure',
  },
]

const workflowIcons: ComponentType<{ className?: string }>[] = [ClipboardCheck, PackageCheck, Route]

const reveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-12% 0px' },
  transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
} as const

function headerControlClass() {
  return 'border border-black/10 bg-white/55 text-[#15171c] shadow-[0_18px_60px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white dark:shadow-none'
}

function FloatingNav() {
  const t = useTypedTranslations()

  return (
    <header className="fixed left-0 right-0 top-4 z-50 px-4 lg:px-16">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4">
        <Link className={`flex size-12 items-center justify-center rounded-full ${headerControlClass()}`} href="/">
          <Boxes className="size-5" />
        </Link>
        <nav className={`hidden items-center rounded-full px-1.5 py-1 md:flex ${headerControlClass()}`}>
          <a className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium opacity-90 transition hover:opacity-100" href="#home">Home</a>
          {navLinks.map(([labelKey, href]) => {
            const content = t(labelKey as any)
            if (href.startsWith('/')) {
              return (
                <Link className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium opacity-80 transition hover:opacity-100" href={href} key={labelKey}>
                  {content}
                </Link>
              )
            }

            return (
              <a className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium opacity-80 transition hover:opacity-100" href={href} key={labelKey}>
                {content}
              </a>
            )
          })}
          <Link className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-semibold text-black" href="/contact">
            {t('common.home.hero.primary')}
            <ArrowUpRight className="size-4" />
          </Link>
        </nav>
        <div className={`flex items-center gap-2 rounded-full px-2 py-1 ${headerControlClass()}`}>
          <LanguageSwitch variant="frontend" />
          <Link className="hidden h-10 items-center rounded-full bg-white/12 px-3 text-xs font-semibold text-white sm:inline-flex" href="/admin/login">
            {t('common.home.nav.admin')}
          </Link>
        </div>
      </div>
    </header>
  )
}

function VideoBackdrop({ className, src }: { className?: string, src: string }) {
  return (
    <>
      <video
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${className ?? ''}`}
        loop
        muted
        playsInline
      >
        <source src={src} />
      </video>
      <div className="absolute inset-0 bg-white/55 dark:bg-black/50" />
      <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-[#f6f8fb] to-transparent dark:from-black" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-[#f6f8fb] to-transparent dark:from-black" />
    </>
  )
}

export function HomePageClient({ materials }: HomePageClientProps) {
  const t = useTypedTranslations()

  return (
    <main className="dark min-h-dvh overflow-hidden bg-black font-body text-white" id="home">
      <FloatingNav />

      <section className="relative flex min-h-[920px] overflow-hidden px-5 pb-8 pt-36 lg:px-8">
        <video
          autoPlay
          className="absolute left-1/2 top-[18%] z-0 h-auto w-[1600px] max-w-none -translate-x-1/2 object-contain opacity-25 dark:opacity-80"
          loop
          muted
          playsInline
          poster="/images/hero_bg.jpeg"
        >
          <source src={heroVideoUrl} type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_20%,rgba(90,170,255,0.18),transparent_36%),linear-gradient(180deg,rgba(246,248,251,0.26),rgba(246,248,251,0.96))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(90,170,255,0.28),transparent_36%),linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.92))]" />
        <div className="absolute inset-x-0 bottom-0 z-0 h-72 bg-linear-to-b from-transparent to-[#f6f8fb] dark:to-black" />

        <div className="relative z-10 mx-auto flex min-h-[760px] w-full max-w-[1380px] flex-col items-center text-center">
          <motion.div animate={{ opacity: 1, y: 0 }} className="rounded-full border border-black/10 bg-white/55 px-1 py-1 shadow-[0_18px_60px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 flex items-center" initial={{ opacity: 0, y: 18 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}>
            <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-black">Live</span>
            <span className="px-3 text-sm text-[#4b5563] dark:text-white/82">{t('common.home.hero.badge')}</span>
          </motion.div>

          <motion.h1
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            className="mt-8 max-w-4xl font-heading text-[clamp(4.2rem,10vw,8.4rem)] italic leading-[0.82]"
            initial={{ filter: 'blur(10px)', opacity: 0, y: 45 }}
            transition={{ delay: 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {t('common.home.hero.title')}
          </motion.h1>

          <motion.p
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            className="mt-7 max-w-xl text-base font-light leading-7 text-[#4b5563] dark:text-white/76"
            initial={{ filter: 'blur(8px)', opacity: 0, y: 22 }}
            transition={{ delay: 0.34, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            {t('common.home.hero.description')}
          </motion.p>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 24 }}
            transition={{ delay: 0.5, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link className="liquid-glass-strong inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#15171c] dark:text-white" href="/contact">
              {t('common.home.hero.primary')}
              <ArrowUpRight className="size-4" />
            </Link>
            <a className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[#4b5563] transition hover:text-[#15171c] dark:text-white/86 dark:hover:text-white" href="#platform">
              <Play className="size-4 fill-current" />
              {t('common.home.hero.secondary')}
            </a>
          </motion.div>

          <motion.div className="mt-auto w-full pb-6 pt-20" {...reveal}>
            <div className="flex flex-col items-center gap-7">
              <span className="rounded-full border border-black/10 bg-white/55 px-4 py-2 text-xs text-[#5b6472] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white/70">{t('common.home.channels.label')}</span>
              <div className="flex flex-wrap items-center justify-center gap-9 md:gap-14">
                {marketplaceNames.map(partner => (
                  <span className="font-heading text-3xl italic text-[#15171c]/75 dark:text-white/88 md:text-4xl" key={partner}>{partner}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-28 lg:px-8" id="process">
        <VideoBackdrop src={startVideoUrl} />
        <motion.div className="relative z-10 mx-auto flex min-h-[480px] max-w-3xl flex-col items-center justify-center text-center" {...reveal}>
          <span className="rounded-full border border-black/10 bg-white/55 px-4 py-1.5 text-sm text-[#4b5563] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white/76">{t('common.home.workflow.eyebrow')}</span>
          <h2 className="mt-7 font-heading text-5xl italic leading-[0.9] md:text-7xl">{t('common.home.workflow.title')}</h2>
          <p className="mt-6 max-w-2xl text-base font-light leading-7 text-[#5b6472] dark:text-white/62">
            {t('common.home.workflow.description')}
          </p>
          <Link className="liquid-glass-strong mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#15171c] dark:text-white" href="/contact">
            {t('common.home.platform.cta')}
            <ArrowUpRight className="size-4" />
          </Link>
        </motion.div>
      </section>

      <section className="px-5 py-24 lg:px-8" id="platform">
        <div className="mx-auto max-w-[1180px]">
          <motion.div className="text-center" {...reveal}>
            <span className="rounded-full border border-black/10 bg-white/55 px-4 py-1.5 text-sm text-[#4b5563] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white/72">{t('common.home.features.eyebrow')}</span>
            <h2 className="mt-6 font-heading text-5xl italic leading-[0.9] md:text-7xl">{t('common.home.features.title')}</h2>
          </motion.div>

          <div className="mt-16 grid gap-8">
            {featureRows.map((feature, index) => (
              <motion.article
                className={`grid gap-8 lg:grid-cols-2 lg:items-center ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
                key={feature.titleKey}
                {...reveal}
              >
                <div className="max-w-xl">
                  <h3 className="font-heading text-4xl italic leading-none md:text-6xl">{t(feature.titleKey as any)}</h3>
                  <p className="mt-6 text-base font-light leading-7 text-[#5b6472] dark:text-white/62">{t(feature.bodyKey as any)}</p>
                  <Link className="liquid-glass-strong mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#15171c] dark:text-white" href={index === 0 ? '#resources' : '/contact'}>
                    {t(feature.ctaKey as any)}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>
                <div className="relative aspect-[1.45] overflow-hidden rounded-2xl border border-black/10 bg-white/50 shadow-[0_30px_100px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:shadow-none">
                  <img
                    alt={t(feature.titleKey as any)}
                    className="object-cover size-full"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    src={feature.image}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/42 via-transparent to-transparent" />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-8" id="specialties">
        <div className="mx-auto max-w-[1180px]">
          <motion.div className="text-center" {...reveal}>
            <span className="rounded-full border border-black/10 bg-white/55 px-4 py-1.5 text-sm text-[#4b5563] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white/72">{t('common.home.nav.specialties')}</span>
            <h2 className="mt-6 font-heading text-5xl italic leading-[0.9] md:text-7xl">{t('common.home.specialties.title')}</h2>
          </motion.div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((item, index) => {
              const Icon = item.icon

              return (
                <motion.article className="rounded-2xl border border-black/10 bg-white/55 p-6 shadow-[0_24px_90px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:shadow-none" key={item.title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.05 }}>
                  <span className="liquid-glass-strong flex size-10 items-center justify-center rounded-full text-[#15171c] dark:text-white">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-7 font-heading text-3xl italic leading-none">{item.title}</h3>
                  <p className="mt-4 text-sm font-light leading-6 text-[#5b6472] dark:text-white/58">{t(item.bodyKey as any)}</p>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-28 lg:px-8">
        <VideoBackdrop className="saturate-0" src={statsVideoUrl} />
        <motion.div className="relative z-10 mx-auto max-w-[1180px] rounded-3xl border border-black/10 bg-white/55 p-8 shadow-[0_30px_120px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:shadow-none md:p-14 lg:p-16" {...reveal}>
          <div className="grid gap-8 md:grid-cols-4">
            {metrics.map(([value, label]) => (
              <div className="text-center" key={label}>
                <p className="font-heading text-5xl italic leading-none md:text-6xl">{value}</p>
                <p className="mt-3 text-sm font-light text-[#5b6472] dark:text-white/58">{label.startsWith('common.') ? t(label as any) : label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="px-5 py-24 lg:px-8" id="resources">
        <div className="mx-auto max-w-[1180px]">
          <motion.div className="flex flex-wrap items-end justify-between gap-5" {...reveal}>
            <div>
              <span className="rounded-full border border-black/10 bg-white/55 px-4 py-1.5 text-sm text-[#4b5563] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white/72">{t('common.home.materials.eyebrow')}</span>
              <h2 className="mt-6 max-w-3xl font-heading text-5xl italic leading-[0.9] md:text-7xl">{t('common.home.materials.title')}</h2>
            </div>
            <Link className="liquid-glass-strong inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#15171c] dark:text-white" href="/admin/login">
              {t('common.home.materials.cta')}
              <ArrowUpRight className="size-4" />
            </Link>
          </motion.div>

          <div className="mt-10 grid auto-rows-fr gap-5 md:grid-cols-3">
            {materials.map((material, index) => (
              <Link className="group block h-full" href={`/details/${material.id}`} key={material.id}>
                <motion.article className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/55 shadow-[0_24px_90px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:shadow-none" {...reveal} transition={{ ...reveal.transition, delay: index * 0.06 }} whileHover={{ y: -8 }}>
                  <div className="relative aspect-[1.25] overflow-hidden">
                    <img
                      alt={material.title}
                      className="size-full object-cover transition duration-700 group-hover:scale-105"
                      src={material.coverUrl || fallbackImages[index % fallbackImages.length]}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <Chip className="max-w-max bg-black/8 text-[#15171c] dark:bg-white/12 dark:text-white" size="sm" variant="soft">{material.categoryName ?? material.category}</Chip>
                    <h3 className="mt-5 font-heading text-3xl italic leading-none">{material.title}</h3>
                    <p className="mt-4 line-clamp-3 text-sm font-light leading-6 text-[#5b6472] dark:text-white/58">{material.summary}</p>
                  </div>
                </motion.article>
              </Link>
            ))}
            {!materials.length && (
              <div className="rounded-2xl border border-black/10 bg-white/55 p-8 text-center text-sm text-[#5b6472] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white/62 md:col-span-3">
                {t('common.home.materials.empty')}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <motion.div className="text-center" {...reveal}>
            <span className="rounded-full border border-black/10 bg-white/55 px-4 py-1.5 text-sm text-[#4b5563] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white/72">{t('common.home.workflow.eyebrow')}</span>
            <h2 className="mt-6 font-heading text-5xl italic leading-[0.9] md:text-7xl">{t('common.home.platform.title')}</h2>
          </motion.div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {['connect', 'prepare', 'ship'].map((key, index) => {
              const Icon = workflowIcons[index]

              return (
                <motion.article className="rounded-2xl border border-black/10 bg-white/55 p-8 shadow-[0_24px_90px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:shadow-none" key={key} {...reveal} transition={{ ...reveal.transition, delay: index * 0.06 }}>
                  <Icon className="size-6" />
                  <h3 className="mt-8 text-sm font-medium">{t(`common.home.workflow.steps.${key}.title` as any)}</h3>
                  <p className="mt-4 text-sm font-light leading-7 text-[#5b6472] dark:text-white/70">{t(`common.home.workflow.steps.${key}.description` as any)}</p>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-28 lg:px-8">
        <VideoBackdrop src={ctaVideoUrl} />
        <div className="relative z-10 mx-auto max-w-[1180px] text-center">
          <motion.div {...reveal}>
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-4 py-1.5 text-sm text-[#4b5563] backdrop-blur-xl dark:border-white/20 dark:bg-white/8 dark:text-white/72">
              <Sparkles className="size-4" />
              {t('common.home.form.eyebrow')}
            </span>
            <h2 className="mx-auto mt-7 max-w-4xl font-heading text-6xl italic leading-[0.85] md:text-8xl">{t('common.home.form.title')}</h2>
            <p className="mx-auto mt-7 max-w-2xl text-base font-light leading-7 text-[#5b6472] dark:text-white/64">
              {t('common.home.form.description')}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link className="liquid-glass-strong inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#15171c] dark:text-white" href="/contact">
                {t('common.home.form.submit')}
                <ArrowUpRight className="size-4" />
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black" href="/admin/login">
                {t('common.home.nav.admin')}
              </Link>
            </div>
          </motion.div>

          <footer className="mt-28 flex flex-col items-center justify-between gap-5 border-t border-black/10 pt-8 text-xs text-[#5b6472] dark:border-white/10 dark:text-white/40 md:flex-row">
            <div className="flex items-center gap-2">
              <Boxes className="size-4" />
              <span>
                (c) 2026
                {t('common.home.brand')}
                . All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-5">
              <a href="#home">Privacy</a>
              <a href="#home">Terms</a>
              <Link href="/contact">Contact</Link>
            </div>
          </footer>
        </div>
      </section>

      <div className="fixed bottom-4 left-4 z-40 md:hidden">
        <Link className="liquid-glass-strong inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#15171c] dark:text-white" href="/contact">
          <CheckCircle2 className="size-4" />
          {t('common.home.hero.primary')}
        </Link>
      </div>
    </main>
  )
}

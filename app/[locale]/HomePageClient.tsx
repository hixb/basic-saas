'use client'

import type { ComponentType } from 'react'
import { Accordion, Chip } from '@heroui/react'
import { motion } from 'framer-motion'
import { Boxes, ClipboardCheck, PackageCheck, Ship } from 'lucide-react'
import { Link } from '~/components/navigation/Link'
import { LanguageSwitch } from '~/components/switcher/LanguageSwitch'
import { ThemeSwitch } from '~/components/switcher/ThemeSwitch'
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

const specialtyImages = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1494412685616-a5d310fbb07d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
]

const workflowIcons: ComponentType<{ className?: string }>[] = [ClipboardCheck, PackageCheck, Ship]
const reveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-12% 0px' },
  transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
} as const

export function HomePageClient({ materials }: HomePageClientProps) {
  const t = useTypedTranslations()

  return (
    <main className="min-h-dvh bg-[#b8462f] text-[#1d1b17] dark:bg-[#062f38] dark:text-[#f4efe7]">
      <header className="sticky top-0 z-50 border-b border-black/8 bg-[#fbfaf6]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#062f38]/88">
        <div className="mx-auto flex h-14 max-w-345 items-center justify-between px-5 lg:px-8">
          <Link className="flex items-center gap-2 text-sm font-semibold" href="/">
            <Boxes className="size-4" />
            {t('common.home.brand')}
          </Link>
          <nav className="hidden items-center gap-8 text-[12px] font-medium text-[#1d1b17]/70 dark:text-white/68 md:flex">
            <a className="hover:text-[#1d1b17] dark:hover:text-white" href="#platform">{t('common.home.nav.platform')}</a>
            <a className="hover:text-[#1d1b17] dark:hover:text-white" href="#specialties">{t('common.home.nav.specialties')}</a>
            <a className="hover:text-[#1d1b17] dark:hover:text-white" href="#resources">{t('common.home.nav.insights')}</a>
            <Link className="hover:text-[#1d1b17] dark:hover:text-white" href="/contact">{t('common.home.nav.contact')}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <ThemeSwitch />
            <Link className="inline-flex h-11 items-center rounded-sm bg-[#b8462f] px-4 text-[12px] font-semibold text-white" href="/admin/login">
              {t('common.home.nav.admin')}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-345 rounded-b-xl bg-[#fbfaf6] px-5 pb-14 pt-16 dark:bg-[#f4efe7] dark:text-[#1d1b17] lg:px-8 lg:pt-24">
        <div className="grid gap-8 lg:grid-cols-[1.16fr_0.84fr] lg:items-end">
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 18 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}>
            <h1 className="max-w-215 font-serif text-[clamp(4rem,8.6vw,6.6rem)] leading-[0.88] tracking-normal text-[#28231d]">
              {t('common.home.hero.title')}
            </h1>
            <p className="mt-7 max-w-2xl border-l border-[#b8462f]/45 pl-4 text-[17px] leading-8 text-[#4e4840]">
              {t('common.home.hero.description')}
            </p>
            <div className="mt-7 flex gap-3">
              <Link className="inline-flex h-9 items-center rounded-sm bg-[#b8462f] px-4 text-[12px] font-semibold text-white" href="/contact">
                {t('common.home.hero.primary')}
              </Link>
              <a className="inline-flex h-9 items-center rounded-sm border border-[#28231d]/15 px-4 text-[12px] font-semibold" href="#resources">
                {t('common.home.hero.secondary')}
              </a>
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 12px)' }}
            className="relative min-h-90 overflow-hidden rounded-xl bg-[#15100d] lg:min-h-107.5"
            initial={{ opacity: 0, y: 18, clipPath: 'inset(7% 5% 7% 5% round 18px)' }}
            transition={{ delay: 0.12, duration: 0.86, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={{ scale: 1.06, x: [0, -10, 0] }}
              className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,.48),rgba(8,8,8,.12)),url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center"
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute inset-0 bg-black/18 backdrop-blur-[1px]" />
            <div className="absolute left-7 right-7 top-7 flex items-center justify-between border-b border-white/18 pb-4 text-[11px] text-white/78">
              <span>{t('common.home.hero.panelLabel')}</span>
              <span>{t('common.home.hero.panelStatus')}</span>
            </div>
            <div className="absolute bottom-8 right-8 max-w-sm text-white">
              <p className="font-serif text-3xl leading-tight">{t('common.home.hero.panelTitle')}</p>
              <div className="mt-5 grid grid-cols-3 gap-px bg-white/18 text-center text-[11px]">
                {['Amazon', 'Shopify', 'TikTok'].map(channel => (
                  <span className="bg-black/35 px-3 py-2" key={channel}>{channel}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div className="mt-16 border-t border-[#28231d]/10 pt-6" {...reveal}>
          <p className="mb-4 text-[10px] uppercase tracking-[0.18em] text-[#6f665e]">{t('common.home.channels.label')}</p>
          <div className="grid grid-cols-2 gap-px border border-[#28231d]/10 bg-[#28231d]/10 md:grid-cols-6">
            {['Amazon', 'Shopify', 'TikTok Shop', 'Walmart', 'DTC', '3PL'].map(channel => (
              <div className="bg-[#fbfaf6] py-4 text-center font-serif text-lg text-[#4c453d]" key={channel}>
                {channel}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="px-5 py-20 text-white lg:px-8">
        <motion.div className="mx-auto grid max-w-5xl grid-cols-1 gap-px bg-white/16 md:grid-cols-3" {...reveal}>
          {[
            ['3M+', 'common.home.metrics.orders'],
            ['10x', 'common.home.metrics.countries'],
            ['34x', 'common.home.metrics.sla'],
          ].map(([value, label]) => (
            <motion.div className="bg-[#b8462f] px-10 py-8 text-center dark:bg-[#062f38]" key={value} whileHover={{ y: -6 }}>
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/58">{t(label as any)}</p>
              <p className="mt-5 font-serif text-6xl leading-none">{value}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div className="mx-auto mt-16 max-w-4xl rounded-md bg-white/10 p-8 text-center backdrop-blur-sm" {...reveal}>
          <p className="font-serif text-2xl leading-snug text-white/86">
            {t('common.home.quote')}
          </p>
        </motion.div>
      </section>

      <section className="rounded-t-xl bg-[#fbfaf6] px-5 py-16 dark:bg-[#f4efe7] dark:text-[#1d1b17] lg:px-8" id="specialties">
        <div className="mx-auto max-w-345">
          <motion.h2 className="text-center font-serif text-4xl text-[#28231d] md:text-5xl" {...reveal}>
            {t('common.home.specialties.title')}
          </motion.h2>
          <div className="mt-10 grid gap-3 md:grid-cols-4">
            {['catalog', 'fulfillment', 'compliance', 'analytics'].map((key, index) => (
              <motion.div className="group relative h-80 overflow-hidden rounded-lg bg-[#d8d2c8]" key={key} {...reveal} transition={{ ...reveal.transition, delay: index * 0.06 }} whileHover={{ y: -8 }}>
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${specialtyImages[index]})` }} />
                <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/8 to-transparent" />
                <span className="absolute bottom-5 left-5 rounded-full bg-white/78 px-3 py-1 text-[11px] font-semibold text-[#28231d]">
                  {t(`common.home.specialties.items.${key}` as any)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#073f4a] px-5 py-24 text-white dark:bg-[#082f37] lg:px-8" id="platform">
        <div className="mx-auto grid max-w-270 gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div {...reveal}>
            <h2 className="max-w-xl font-serif text-5xl leading-[0.96]">
              {t('common.home.platform.title')}
            </h2>
            <Link className="mt-8 inline-flex h-8 items-center rounded-sm bg-white/12 px-4 text-[12px] font-semibold" href="/contact">
              {t('common.home.platform.cta')}
            </Link>
          </motion.div>
          <div className="grid gap-8">
            {['connect', 'prepare', 'ship'].map((key, index) => {
              const Icon = workflowIcons[index]
              return (
                <motion.div className="grid gap-5 border-t border-white/16 pt-8 sm:grid-cols-[52px_1fr]" key={key} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }}>
                  <span className="flex size-12 items-center justify-center rounded-sm bg-white text-[#073f4a]">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl">{t(`common.home.workflow.steps.${key}.title` as any)}</h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/62">{t(`common.home.workflow.steps.${key}.description` as any)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="-mt-10 rounded-xl bg-[#fbfaf6] px-5 py-16 dark:bg-[#f4efe7] dark:text-[#1d1b17] lg:px-8" id="resources">
        <div className="mx-auto max-w-270">
          <motion.div className="flex flex-wrap items-end justify-between gap-4" {...reveal}>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#b8462f]">{t('common.home.materials.eyebrow')}</p>
              <h2 className="mt-3 font-serif text-4xl text-[#28231d]">{t('common.home.materials.title')}</h2>
            </div>
            <Link className="inline-flex h-8 items-center rounded-sm border border-[#28231d]/12 px-4 text-[12px] font-semibold" href="/admin/login">
              {t('common.home.materials.cta')}
            </Link>
          </motion.div>
          <div className="mt-8 grid auto-rows-fr gap-4 md:grid-cols-3">
            {materials.map((material, index) => (
              <Link className="group block h-full" href={`/details/${material.id}`} key={material.id}>
                <motion.article className="flex h-full flex-col overflow-hidden rounded-lg border border-[#28231d]/10 bg-white" {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }} whileHover={{ y: -8 }}>
                  <div
                    className="h-56 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ backgroundImage: `url(${material.coverUrl || specialtyImages[index % specialtyImages.length]})` }}
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <Chip className="max-w-max" size="sm" variant="soft">{material.categoryName ?? material.category}</Chip>
                    <h3 className="mt-4 font-serif text-2xl leading-tight">{material.title}</h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#5f574f]">{material.summary}</p>
                  </div>
                </motion.article>
              </Link>
            ))}
            {!materials.length && (
              <div className="rounded-lg border border-[#28231d]/10 bg-white p-8 text-center text-sm text-[#5f574f] md:col-span-3">
                {t('common.home.materials.empty')}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf6] px-5 py-20 dark:bg-[#f4efe7] dark:text-[#1d1b17] lg:px-8" id="faq">
        <div className="mx-auto grid max-w-270 gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <motion.div {...reveal}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#b8462f]">{t('common.home.faq.eyebrow')}</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight text-[#28231d]">{t('common.home.faq.title')}</h2>
          </motion.div>
          <motion.div {...reveal}>
            <Accordion>
              {[0, 1, 2, 3].map(index => (
                <Accordion.Item id={`faq-${index}`} key={index}>
                  <Accordion.Trigger>{t(`common.home.faq.items.${index}.question` as any)}</Accordion.Trigger>
                  <Accordion.Body>{t(`common.home.faq.items.${index}.answer` as any)}</Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <footer className="bg-[#b8462f] px-5 py-16 text-white lg:px-8">
        <div className="mx-auto grid max-w-270 gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Boxes className="size-4" />
              {t('common.home.brand')}
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/68">{t('common.home.footer.description')}</p>
          </div>
          <div className="grid gap-2 text-sm text-white/72">
            <p className="font-semibold text-white">{t('common.home.footer.platform')}</p>
            <a href="#specialties">{t('common.home.nav.specialties')}</a>
            <a href="#resources">{t('common.home.nav.insights')}</a>
          </div>
          <div className="grid gap-2 text-sm text-white/72">
            <p className="font-semibold text-white">{t('common.home.footer.connect')}</p>
            <Link href="/contact">{t('common.home.nav.contact')}</Link>
            <Link href="/admin/login">{t('common.home.nav.admin')}</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

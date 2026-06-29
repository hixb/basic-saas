import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ContactPageClient from './ContactPageClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common')

  return {
    title: t('contact.title'),
    description: t('contact.description'),
    openGraph: {
      title: t('contact.title'),
      description: t('contact.description'),
      type: 'website',
    },
  }
}

export default function ContactPage() {
  return <ContactPageClient />
}

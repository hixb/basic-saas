import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ProviderLayout } from '~/components/providers/ProviderLayout'

type LocaleLayoutProps = Readonly<{
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}>

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ProviderLayout>
        {children}
      </ProviderLayout>
    </NextIntlClientProvider>
  )
}

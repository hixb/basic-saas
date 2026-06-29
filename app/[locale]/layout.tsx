import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Provider } from '~/app/provider'
import { ProviderLayout } from '~/components/providers/ProviderLayout'
import '@uiw/react-md-editor/markdown-editor.css'
import '../globals.css'

type LocaleLayoutProps = Readonly<{
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}>

export const metadata: Metadata = {
  title: 'CargoPilot',
  description: 'Cross-border commerce operations platform.',
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Provider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ProviderLayout>
              {children}
            </ProviderLayout>
          </NextIntlClientProvider>
        </Provider>
      </body>
    </html>
  )
}

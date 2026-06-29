import type { ReactNode } from 'react'
import { Barlow, Instrument_Serif } from 'next/font/google'
import { RootProvider } from './root-provider'
import '@uiw/react-md-editor/markdown-editor.css'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: '400',
  variable: '--font-heading',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
})

export const metadata = {
  title: 'CargoPilot',
  description: 'Cross-border commerce operations platform.',
}

export default function LocaleLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html className={`${instrumentSerif.variable} ${barlow.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  )
}

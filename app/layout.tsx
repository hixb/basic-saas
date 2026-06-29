import type { ReactNode } from 'react'
import { RootProvider } from './root-provider'
import '@uiw/react-md-editor/markdown-editor.css'
import './globals.css'

export const metadata = {
  title: 'CargoPilot',
  description: 'Cross-border commerce operations platform.',
}

export default function LocaleLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  )
}

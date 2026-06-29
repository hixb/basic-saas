'use client'

import type { ReactNode } from 'react'
import { Toast } from '@heroui/react'
import { ThemeProvider } from 'next-themes'
import NextTopLoader from 'nextjs-toploader'
import { AnalyticsProvider } from '~/components/analytics/AnalyticsProvider'
import { WEBSITE_CONFIG } from '~/config/website'

export function Provider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme={WEBSITE_CONFIG.theme.defaultTheme}>
      <Toast.Provider placement="top" />
      <NextTopLoader color="var(--accent)" />
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
    </ThemeProvider>
  )
}

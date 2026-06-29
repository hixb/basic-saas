'use client'

import type { ReactNode } from 'react'
import { LazyPopupRenderer } from '~/components/global/LazyPopupRenderer'
import { PopupInitializer } from '~/components/global/PopupInitializer'
import { PopupProvider } from '~/context/usePopupContext'

export function ProviderLayout({ children }: { children: ReactNode }) {
  return (
    <PopupProvider>
      {children}

      <LazyPopupRenderer />
      <PopupInitializer />
    </PopupProvider>
  )
}

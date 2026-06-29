'use client'

import type { ReactNode } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useLayoutEffect } from 'react'
import { AdminSidebar } from '~/components/admin/AdminSidebar'
import { AdminTopbar } from '~/components/admin/AdminTopbar'
import { usePathname } from '~/lib/i18n/navigation'

interface AdminMainProps {
  readonly children: ReactNode
  title?: string
  description?: string
}

const TRANSITION = {
  opacity: { duration: 0.28, ease: 'easeInOut' as const },
  scale: { duration: 0.35 },
  filter: { duration: 0.35, ease: 'easeInOut' as const },
}

export function AdminMain({ title, description, children }: AdminMainProps) {
  const pathname = usePathname()
  const controls = useAnimationControls()

  useLayoutEffect(() => {
    controls.set({ opacity: 0, scale: 0.97, filter: 'blur(8px)' })
    void controls.start({ opacity: 1, scale: 1, filter: 'blur(0px)', transition: TRANSITION })
  }, [pathname, controls])

  return (
    <div className="flex h-dvh flex-col sm:flex-row">
      <AdminSidebar />

      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <AdminTopbar />
        <motion.div
          animate={controls}
          className="px-6 pb-3 pt-6 sm:pt-8 sm:px-8"
          initial={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
          style={{ willChange: 'transform, opacity, filter' }}
        >
          {title?.trim() && (
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {title}
              </h1>
              {description?.trim() && (
                <p className="mt-1.5 text-sm text-muted">
                  {description}
                </p>
              )}
            </header>
          )}
          {children}
        </motion.div>
      </main>
    </div>
  )
}

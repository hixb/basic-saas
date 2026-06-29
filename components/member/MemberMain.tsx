'use client'

import type { ReactNode } from 'react'

interface MemberMainProps {
  readonly children: ReactNode
  title?: string
  description?: string
}

export function MemberMain(props: MemberMainProps) {
  return (
    <main className="md:min-h-dvh w-full overflow-y-auto overflow-x-hidden p-4 sm:flex-1">
      {props.title?.trim() && (
        <header>
          <h1 className="text-3xl font-bold text-default-foreground">{props.title}</h1>
          {props.description?.trim() && (
            <p className="mt-2 text-sm text-muted">{props.description}</p>
          )}
        </header>
      )}
      <section className="mt-6">
        {props.children}
      </section>
    </main>
  )
}

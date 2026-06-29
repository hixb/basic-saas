'use client'

import { useCallback, useState } from 'react'
import { LoginForm } from '~/components/admin/login/LoginForm'
import { LoginPersonalityAnimation } from '~/components/admin/login/LoginPersonalityAnimation'
import { WEBSITE_CONFIG } from '~/config/website'

type FocusState = 'none' | 'email' | 'password'

export function LoginMain() {
  const [focusState, setFocusState] = useState<FocusState>('none')

  const handleFocusChange = useCallback((state: FocusState) => {
    setFocusState(prev => (prev === state ? prev : state))
  }, [])

  return (
    <main className="flex h-dvh">
      <LoginPersonalityAnimation focusState={focusState} />

      <div className="flex w-full items-center justify-center px-8 md:w-1/3">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to your
            {' '}
            {WEBSITE_CONFIG.siteName}
            {' '}
            admin account to continue
          </p>

          <div className="mt-8">
            <LoginForm onFocusChange={handleFocusChange} />
          </div>
        </div>
      </div>
    </main>
  )
}

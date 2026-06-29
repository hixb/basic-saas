'use client'

import { useCallback, useState } from 'react'
import { LoginForm } from '~/components/admin/login/LoginForm'
import { LoginPersonalityAnimation } from '~/components/admin/login/LoginPersonalityAnimation'
import { WEBSITE_CONFIG } from '~/config/website'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'

type FocusState = 'none' | 'email' | 'password'

export function LoginMain() {
  const t = useTypedTranslations()
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
            {t('common.admin.login.title')}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t('common.admin.login.description', { siteName: WEBSITE_CONFIG.siteName })}
          </p>

          <div className="mt-8">
            <LoginForm onFocusChange={handleFocusChange} />
          </div>
        </div>
      </div>
    </main>
  )
}

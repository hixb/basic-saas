'use client'

import type { SyntheticEvent } from 'react'
import { Button, Checkbox, FieldError, Form, InputGroup, Label, Spinner, TextField } from '@heroui/react'
import { Eye, EyeOff } from 'lucide-react'
import { useCallback, useRef, useState, useTransition } from 'react'
import { AdminApi } from '~/apis/admin'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'
import { useRouter } from '~/lib/i18n/navigation'
import { loginSchema } from '~/shared/schemas/auth.schema'
import { ResponseCode } from '~/shared/types/api.type'

type FocusState = 'none' | 'email' | 'password'

interface LoginFormProps {
  onFocusChange: (state: FocusState) => void
}

export function LoginForm({ onFocusChange }: LoginFormProps) {
  const t = useTypedTranslations()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const syncFocusFromActiveElement = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement | null

    if (activeElement && formRef.current?.contains(activeElement)) {
      const activeField = activeElement.getAttribute('name')

      if (activeField === 'email' || activeField === 'password') {
        onFocusChange(activeField)
        return
      }
    }

    onFocusChange('none')
  }, [onFocusChange])

  const handleFieldBlur = useCallback(() => {
    requestAnimationFrame(syncFocusFromActiveElement)
  }, [syncFocusFromActiveElement])

  const onSubmit = useCallback((evt: SyntheticEvent<HTMLFormElement>) => {
    evt.preventDefault()

    const formData = new FormData(evt.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    startTransition(async () => {
      await AdminApi.auth.login({ email, password })
        .then((res) => {
          if (res.code === ResponseCode.SUCCESS) {
            router.push('/admin/dashboard')
          }
        })
    })
  }, [router])

  return (
    <Form className="flex w-96 flex-col gap-4" onSubmit={onSubmit} ref={formRef}>
      <TextField
        isRequired
        name="email"
        onBlur={handleFieldBlur}
        onFocus={() => onFocusChange('email')}
        type="email"
        validate={(value) => {
          const result = loginSchema.shape.email.safeParse(value)
          return result.success ? null : result.error.issues[0].message
        }}
      >
        <Label>{t('common.admin.login.email')}</Label>
        <InputGroup>
          <InputGroup.Input placeholder="john@example.com" />
        </InputGroup>
        <FieldError />
      </TextField>
      <TextField
        isRequired
        minLength={8}
        name="password"
        onBlur={handleFieldBlur}
        onFocus={() => onFocusChange('password')}
        type={showPassword ? 'text' : 'password'}
        validate={(value) => {
          const result = loginSchema.shape.password.safeParse(value)
          return result.success ? null : result.error.issues[0].message
        }}
      >
        <Label>{t('common.admin.login.password')}</Label>
        <InputGroup>
          <InputGroup.Input placeholder={t('common.admin.login.passwordPlaceholder')} />
          <InputGroup.Suffix>
            <Button
              aria-label={showPassword ? t('common.admin.login.hidePassword') : t('common.admin.login.showPassword')}
              className="size-7"
              onPress={() => setShowPassword(prev => !prev)}
              size="sm"
              variant="ghost"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </Button>
          </InputGroup.Suffix>
        </InputGroup>
        <FieldError />
      </TextField>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Checkbox id="basic-terms">
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox>
          <Label htmlFor="basic-terms">{t('common.admin.login.rememberEmail')}</Label>
        </div>
        <Button className="w-full" isPending={isPending} type="submit">
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : null}
              {t('common.admin.login.submit')}
            </>
          )}
        </Button>
      </div>
    </Form>
  )
}

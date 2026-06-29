'use client'

import type { ComponentType, ReactNode } from 'react'

import { Button, Label, ListBox, Popover } from '@heroui/react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'
import { Imac, Moon, Sun } from '~/components/icons'
import { WEBSITE_CONFIG } from '~/config/website'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'

interface IconBoxProps {
  children: ReactNode
  isActive?: boolean
  label: string
  onPress: () => void
}

const THEME_OPTIONS: Array<{ Icon: ComponentType<{ className?: string }>, labelKey: string, value: ThemeValue }> = [
  { value: 'light', labelKey: 'common.switcher.theme.light', Icon: Sun },
  { value: 'dark', labelKey: 'common.switcher.theme.dark', Icon: Moon },
  { value: 'system', labelKey: 'common.switcher.theme.system', Icon: Imac },
]

function IconBox({ children, isActive, label, onPress }: IconBoxProps) {
  return (
    <Button
      aria-pressed={isActive}
      className="rounded-full p-2 aspect-square flex items-center"
      isIconOnly
      onPress={onPress}
      variant={isActive ? 'tertiary' : 'ghost'}
    >
      <span className="sr-only">{label}</span>
      {children}
    </Button>
  )
}

function normalizeTheme(value?: string): ThemeValue {
  if (value === 'light' || value === 'dark') {
    return value
  }

  return 'system'
}

export function ThemeSwitch() {
  const t = useTypedTranslations()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = normalizeTheme(theme)
  const currentOption = THEME_OPTIONS.find(opt => opt.value === currentTheme) || THEME_OPTIONS[2]

  const handleChange = useCallback((themeValue: string) => {
    setTheme(themeValue)
  }, [setTheme])

  if (!WEBSITE_CONFIG.theme.showSwitcher)
    return null

  return (
    <>
      <div className="sm:hidden">
        <Popover>
          <Button className="bg-default-hover size-11" isIconOnly variant="tertiary">
            {mounted ? <currentOption.Icon className="text-accent" /> : <Imac />}
          </Button>
          <Popover.Content>
            <Popover.Dialog className="w-48">
              <Popover.Arrow />
              <Popover.Heading>{t('common.switcher.theme.title')}</Popover.Heading>
              <ListBox
                aria-label={t('common.switcher.theme.ariaLabel')}
                className="mt-2 p-0"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0]
                  if (selected && typeof selected === 'string') {
                    handleChange(selected)
                  }
                }}
                selectedKeys={[currentTheme]}
                selectionMode="single"
              >
                {THEME_OPTIONS.map(({ value, labelKey, Icon }) => {
                  const label = t(labelKey as any)

                  return (
                    <ListBox.Item id={value} key={value} textValue={label}>
                      <Icon className="size-4" />
                      <div className="flex flex-col">
                        <Label>{label}</Label>
                      </div>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  )
                })}
              </ListBox>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>

      <div className="hidden sm:flex rounded-full py-1 px-2 items-center bg-default-hover max-w-max">
        {THEME_OPTIONS.map(({ value, labelKey, Icon }) => {
          const isActive = currentTheme === value
          const label = t(labelKey as any)

          return (
            <IconBox
              isActive={!mounted ? false : isActive}
              key={value}
              label={label}
              onPress={() => setTheme(value)}
            >
              <Icon className={isActive && mounted ? 'text-accent' : undefined} />
            </IconBox>
          )
        })}
      </div>
    </>
  )
}

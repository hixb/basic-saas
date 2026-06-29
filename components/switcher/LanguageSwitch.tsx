'use client'

import { Avatar, Button, Label, ListBox, Popover, Skeleton } from '@heroui/react'
import { ChevronDown } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useCallback } from 'react'
import { WEBSITE_CONFIG } from '~/config/website'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'
import { usePathname, useRouter } from '~/lib/i18n/navigation'

const locales = WEBSITE_CONFIG.i18n.locales

export function LanguageSwitch() {
  const t = useTypedTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  const handleChange = useCallback((localeKey: string) => {
    router.replace(pathname, { locale: localeKey })
  }, [router, pathname])

  return (
    <Popover>
      <Button className="bg-default-hover h-11" variant="tertiary">
        <Avatar className="size-6" size="sm">
          <Avatar.Image
            alt={`${locales[currentLocale]?.name || currentLocale} flag`}
            className="rounded-none size-full object-cover"
            src={`/flag/${locales[currentLocale]?.flag || 'default'}.svg`}
          />
          <Avatar.Fallback>
            <Skeleton className="size-6 rounded-full" />
          </Avatar.Fallback>
        </Avatar>
        <span className="hidden md:block">{locales[currentLocale]?.name}</span>
        <ChevronDown />
      </Button>
      <Popover.Content>
        <Popover.Dialog className="w-48">
          <Popover.Arrow />
          <Popover.Heading>{t('common.switcher.language.title')}</Popover.Heading>
          <ListBox
            aria-label={t('common.switcher.language.ariaLabel')}
            className="mt-2 p-0"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0]
              if (selected && typeof selected === 'string') {
                handleChange(selected)
              }
            }}
            selectedKeys={[currentLocale]}
            selectionMode="single"
          >
            {Object.entries(locales).map(([key, config]) => (
              <ListBox.Item id={key} key={key} textValue={config.name}>
                <Avatar size="sm">
                  <Avatar.Image
                    alt={config.name}
                    className="rounded-none size-full object-cover"
                    src={`/flag/${config.flag}.svg`}
                  />
                  <Avatar.Fallback>{key.toUpperCase()}</Avatar.Fallback>
                </Avatar>
                <div className="flex flex-col">
                  <Label>{config.name}</Label>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}

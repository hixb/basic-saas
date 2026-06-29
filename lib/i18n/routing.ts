import { defineRouting } from 'next-intl/routing'
import { WEBSITE_CONFIG } from '~/config/website'

export const routing = defineRouting({
  locales: Object.keys(WEBSITE_CONFIG.i18n.locales),
  defaultLocale: WEBSITE_CONFIG.i18n.defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: false,
  localeCookie: {
    name: 'NEXT_LOCALE',
  },
})

export type Locale = (typeof routing.locales)[number]

import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

async function loadLocaleMessages(locale: string) {
  const localeDir = path.join(process.cwd(), 'messages', locale)
  const files = await readdir(localeDir, { withFileTypes: true })
  const jsonFiles = files.filter(
    file => file.isFile() && file.name.endsWith('.json'),
  )

  if (!jsonFiles.length) {
    throw new Error(`No JSON messages found for locale "${locale}".`)
  }

  const entries = await Promise.all(
    jsonFiles.map(async (file) => {
      const namespace = file.name.replace(/\.json$/, '')
      const module = await import(`../../messages/${locale}/${file.name}`)

      return [namespace, module.default] as const
    }),
  )

  return Object.fromEntries(entries)
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale
  const locale
    = requestedLocale && routing.locales.includes(requestedLocale as any)
      ? requestedLocale
      : routing.defaultLocale

  const messages = await loadLocaleMessages(locale)

  return {
    locale,
    messages,
  }
})

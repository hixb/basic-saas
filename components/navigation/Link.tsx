import type { LinkProps as NextLinkProps } from 'next/link'
import type { PropsWithChildren } from 'react'
import { useLocale } from 'next-intl'
import NextLink from 'next/link'
import { useMemo } from 'react'
import { WEBSITE_CONFIG } from '~/config/website'
import { usePathname } from '~/lib/i18n/navigation'

const ABSOLUTE_URL_REGEX = /^[a-z][a-z\d+\-.]*:/i
const DEFAULT_LOCALE = WEBSITE_CONFIG.i18n.defaultLocale

type LinkProps = PropsWithChildren<Omit<NextLinkProps, 'className'> & { className?: string }>

function isAbsoluteHref(href: string): boolean {
  if (href.startsWith('//')) {
    return true
  }
  return ABSOLUTE_URL_REGEX.test(href)
}

export function Link({ children, className, ...props }: LinkProps) {
  const locale = useLocale() || DEFAULT_LOCALE
  const asPath = usePathname()

  const href = useMemo(() => {
    const originalHref = props.href

    if (typeof originalHref === 'object' && originalHref.href) {
      return {
        ...originalHref,
        href: `/${locale}${originalHref.href}`,
      }
    }

    if (typeof originalHref === 'string') {
      if (locale === DEFAULT_LOCALE || isAbsoluteHref(originalHref)) {
        return originalHref
      }
      return `/${locale}${originalHref}`
    }

    return originalHref
  }, [locale, props.href])

  const isCanonical = asPath === props.href || asPath === href

  return (
    <NextLink
      className={className}
      {...props}
      href={href}
      hrefLang={locale || undefined}
      rel={isCanonical ? 'canonical' : undefined}
    >
      {children}
    </NextLink>
  )
}

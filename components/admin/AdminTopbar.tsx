'use client'

import type { RecentPage } from '~/hooks/useRecentPages'
import { Button, InputGroup, ScrollShadow, Separator, Tooltip } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pin, PinOff, Search, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { ThemeSwitch } from '~/components/switcher/ThemeSwitch'
import { useRecentPages } from '~/hooks/useRecentPages'
import { usePathname, useRouter } from '~/lib/i18n/navigation'
import { cn } from '~/lib/utils/tools'

/** Maps admin route paths to their sidebar menu labels. */
const ADMIN_NAV_LABELS: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/settings': 'Settings',
}

/** Returns the nav label for the given pathname, with prefix fallback for sub-routes. */
function getNavLabel(pathname: string): string {
  if (ADMIN_NAV_LABELS[pathname])
    return ADMIN_NAV_LABELS[pathname]

  let bestLabel = ''
  let bestLength = 0

  for (const [href, label] of Object.entries(ADMIN_NAV_LABELS)) {
    if (pathname.startsWith(`${href}/`) && href.length > bestLength) {
      bestLabel = label
      bestLength = href.length
    }
  }

  return bestLabel
}

interface HistoryItemProps {
  isCurrent: boolean
  onRemove: () => void
  onTogglePin: () => void
  page: RecentPage
}

function HistoryItem({ page, isCurrent, onTogglePin, onRemove }: HistoryItemProps) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  return (
    <Button
      className={cn(
        'h-8 min-w-0 shrink-0 gap-1 rounded-full border px-2.5 text-sm font-medium transition-colors',
        isCurrent
          ? 'border-accent/25 bg-accent/10 text-accent'
          : page.pinned
            ? 'border-foreground/10 bg-surface-secondary text-foreground hover:border-foreground/20 hover:bg-surface'
            : 'transition-colors bg-surface-secondary border-foreground/10 text-foreground hover:border-foreground/10 hover:bg-surface-secondary hover:text-foreground',
      )}
      onHoverChange={setHovered}
      onPress={isCurrent ? undefined : () => router.push(page.href)}
      variant="ghost"
    >
      {page.pinned && <Pin className="size-2.5 shrink-0 text-accent/70" />}

      <span className="max-w-32 truncate">{page.label}</span>

      <AnimatePresence>
        {hovered && (
          <motion.div
            animate={{ opacity: 1, width: 'auto' }}
            className="ml-0.5 flex shrink-0 items-center overflow-hidden"
            exit={{ opacity: 0, width: 0 }}
            initial={{ opacity: 0, width: 0 }}
            onPointerDown={e => e.stopPropagation()}
            transition={{ duration: 0.15 }}
          >
            <Tooltip delay={400}>
              <Tooltip.Trigger>
                <div
                  aria-label={page.pinned ? 'Unpin page' : 'Pin page'}
                  className="flex size-4 cursor-pointer items-center justify-center rounded-full text-muted/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
                  onClick={onTogglePin}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onTogglePin()}
                  role="button"
                  tabIndex={0}
                >
                  {page.pinned ? <PinOff className="size-2.5" /> : <Pin className="size-2.5" />}
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>{page.pinned ? 'Unpin' : 'Pin'}</p>
              </Tooltip.Content>
            </Tooltip>

            {!isCurrent && (
              <Tooltip delay={400}>
                <Tooltip.Trigger>
                  <div
                    aria-label="Remove from history"
                    className="flex size-4 cursor-pointer items-center justify-center rounded-full text-muted/70 transition-colors hover:bg-danger/10 hover:text-danger"
                    onClick={onRemove}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onRemove()}
                    role="button"
                    tabIndex={0}
                  >
                    <X className="size-2.5" />
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p>Remove</p>
                </Tooltip.Content>
              </Tooltip>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}

export function AdminTopbar() {
  const pathname = usePathname()
  const label = getNavLabel(pathname)
  const { pages, togglePin, remove } = useRecentPages(pathname, label)

  const pinnedPages = pages.filter(p => p.pinned)
  const recentPages = pages.filter(p => !p.pinned)
  const showSeparator = pinnedPages.length > 0 && recentPages.length > 0

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setQuery('')
  }, [])

  return (
    <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-foreground/10 bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <ScrollShadow className="min-w-0 flex-1" hideScrollBar orientation="horizontal" size={32}>
        <div className="flex items-center gap-1.5 py-2">
          <div
            className="shrink-0 overflow-hidden"
            style={{
              maxWidth: searchOpen ? '20rem' : '2rem',
              transition: 'max-width 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            <AnimatePresence initial={false} mode="wait">
              {searchOpen
                ? (
                    <motion.div
                      animate={{ opacity: 1 }}
                      className="m-1"
                      exit={{ opacity: 0 }}
                      initial={{ opacity: 0 }}
                      key="search-input"
                      transition={{ duration: 0.1, delay: 0.08 }}
                    >
                      <InputGroup className="h-8" variant="secondary">
                        <InputGroup.Prefix>
                          <Search className="size-3.5 text-muted" />
                        </InputGroup.Prefix>
                        <InputGroup.Input
                          autoFocus
                          onChange={e => setQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Escape' && closeSearch()}
                          placeholder="Search..."
                          value={query}
                        />
                        <InputGroup.Suffix>
                          <Button
                            className="size-6"
                            isIconOnly
                            onPress={closeSearch}
                            size="sm"
                            variant="ghost"
                          >
                            <X className="size-3" />
                          </Button>
                        </InputGroup.Suffix>
                      </InputGroup>
                    </motion.div>
                  )
                : (
                    <motion.div
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      initial={{ opacity: 0 }}
                      key="search-button"
                      transition={{ duration: 0.1 }}
                    >
                      <Button className="min-w-max" isIconOnly onPress={openSearch} size="sm" variant="tertiary">
                        <Search />
                      </Button>
                    </motion.div>
                  )}
            </AnimatePresence>
          </div>

          {[...pinnedPages, ...recentPages].length
            ? <Separator className="mx-0.5 h-4" orientation="vertical" />
            : null}

          {pinnedPages.map(page => (
            <HistoryItem
              isCurrent={page.href === pathname}
              key={page.href}
              onRemove={() => remove(page.href)}
              onTogglePin={() => togglePin(page.href)}
              page={page}
            />
          ))}

          {showSeparator && <Separator className="mx-0.5 h-4" orientation="vertical" />}

          {recentPages.map(page => (
            <HistoryItem
              isCurrent={page.href === pathname}
              key={page.href}
              onRemove={() => remove(page.href)}
              onTogglePin={() => togglePin(page.href)}
              page={page}
            />
          ))}
        </div>
      </ScrollShadow>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeSwitch />
      </div>
    </div>
  )
}

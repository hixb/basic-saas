'use client'

import type { ComponentType } from 'react'
import { Avatar, Button, Kbd, Label, Popover } from '@heroui/react'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  ChevronsUpDown,
  CircleSmall,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { Link } from '~/components/navigation/Link'
import { usePathname } from '~/lib/i18n/navigation'
import { cn } from '~/lib/utils/tools'

interface NavItem {
  label: string
  href?: string
  icon?: ComponentType<{ className?: string }>
  children?: NavItem[]
}

interface NavItemProps {
  item: NavItem
  pathname: string
  depth?: number
  onClose?: () => void
}

interface SidebarContentProps {
  pathname: string
  onClose?: () => void
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Users', icon: Users, href: '/admin/users' },
  {
    label: 'Personal Center',
    icon: Settings,
    children: [
      { href: '/admin/settings', label: 'Settings' },
    ],
  },
]

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.href)
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  return item.children?.some(child => isItemActive(child, pathname)) ?? false
}

function NavItemRenderer({ item, pathname, depth = 0, onClose }: NavItemProps) {
  const active = isItemActive(item, pathname)
  const [open, setOpen] = useState(active)

  if (item.children) {
    return (
      <div>
        <button
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
            active
              ? 'bg-default/30'
              : 'text-muted hover:bg-surface-secondary hover:text-foreground',
          )}
          onClick={() => setOpen(prev => !prev)}
        >
          {depth > 0 && <span className="shrink-0" style={{ width: `${depth * 12}px` }} />}
          {item.icon ? <item.icon className="size-4 shrink-0" /> : <CircleSmall className="size-4 shrink-0" />}
          <span className="flex-1 text-left">{item.label}</span>
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            className="flex shrink-0 items-center"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <ChevronRight className="size-3.5" />
          </motion.span>
        </button>

        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-in-out',
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-0.5 space-y-0.5">
              {item.children.map(child => (
                <NavItemRenderer
                  depth={depth + 1}
                  item={child}
                  key={child.href ?? child.label}
                  onClose={onClose}
                  pathname={pathname}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-accent/10 text-accent'
          : 'text-muted hover:bg-surface-secondary hover:text-foreground',
      )}
      href={item.href!}
      onClick={onClose}
    >
      {depth > 0 && <span className="shrink-0" style={{ width: `${depth * 12}px` }} />}
      {item.icon ? <item.icon className="size-4 shrink-0" /> : <CircleSmall className="size-4 shrink-0" />}
      {item.label}
    </Link>
  )
}

function SidebarContent({ pathname, onClose }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Image alt="Logo" height={28} loading="eager" src="/logo.svg" width={28} />
          <span className="text-sm font-bold uppercase tracking-widest text-foreground">Admin</span>
        </div>
        {onClose && (
          <Button isIconOnly onPress={onClose} size="sm" variant="ghost">
            <X className="size-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map(item => (
          <NavItemRenderer
            item={item}
            key={item.href ?? item.label}
            onClose={onClose}
            pathname={pathname}
          />
        ))}
      </nav>

      <div className="border-t border-foreground/10 p-3">
        <Popover>
          <Popover.Trigger>
            <div className="mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5">
              <Avatar size="sm">
                <Avatar.Image
                  alt="Admin"
                  src="https://img.heroui.chat/image/avatar?w=400&h=400&u=1"
                />
                <Avatar.Fallback>A</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">Admin User</p>
                <p className="truncate text-xs text-muted">admin@example.com</p>
              </div>
              <Button isIconOnly size="sm" variant="ghost">
                <ChevronsUpDown />
              </Button>
            </div>
          </Popover.Trigger>
          <Popover.Content>
            <Popover.Dialog className="p-2">
              <div className="menu-item menu-item--danger">
                <LogOut className="size-4 shrink-0 text-danger" />
                <Label>Delete file</Label>
                <Kbd className="ms-auto" slot="keyboard" variant="light">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Abbr keyValue="shift" />
                  <Kbd.Content>D</Kbd.Content>
                </Kbd>
              </div>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 p-3 sm:flex">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-surface">
          <SidebarContent pathname={pathname} />
        </div>
      </aside>

      <div className="flex items-center px-4 pt-4 sm:hidden">
        <Button isIconOnly onPress={() => setMobileOpen(true)} size="sm" variant="ghost">
          <Menu className="size-5" />
        </Button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 overflow-hidden bg-surface shadow-2xl">
            <SidebarContent onClose={() => setMobileOpen(false)} pathname={pathname} />
          </aside>
        </div>
      )}
    </>
  )
}

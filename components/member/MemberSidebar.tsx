'use client'

import { Avatar, buttonVariants } from '@heroui/react'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import { Setting } from '~/components/icons'
import { Link } from '~/components/navigation/Link'
import { cn } from '~/lib/utils/tools'

export function MemberSidebar() {
  return (
    <>
      <aside className="hidden h-full w-[320px] overflow-x-hidden overflow-y-scroll sm:flex sm:p-4">
        <div className="relative flex h-full w-72 flex-1 flex-col rounded-2xl bg-surface p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <Image alt="Logo" height={48} loading="eager" src="/logo.svg" width={48} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Avatar>
              <Avatar.Image
                alt="Sarah Johnson"
                src="https://img.heroui.chat/image/avatar?w=400&h=400&u=1"
              />
              <Avatar.Fallback>SJ</Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium">Sarah Johnson</p>
              <p className="text-muted text-xs">Example@example.com</p>
            </div>
          </div>

          <div className="flex-1 overflow-auto py-6 space-y-1">
            <Link
              className={cn(buttonVariants({ variant: 'ghost', fullWidth: true }), 'rounded-lg h-12 justify-start')}
              href="/member/settings"
            >
              <Setting className="m-0 size-6" size={28} />
              Settings
            </Link>
          </div>
        </div>
      </aside>

      <div className="px-6 py-6 sm:hidden flex justify-between sticky top-0 bg-background z-10 dark:border-b border-separator shadow-sm">
        <Image alt="Logo" height={32} loading="eager" src="/logo.svg" width={32} />
        <Menu className="cursor-pointer hover:text-accent opacity-90" size={30} />
      </div>
    </>
  )
}

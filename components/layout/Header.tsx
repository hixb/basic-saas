import { Button, Separator } from '@heroui/react'
import { PanelRightOpen } from 'lucide-react'
import { UserMenu } from '~/components/display/UserMenu'
import { LanguageSwitch } from '~/components/switcher/LanguageSwitch'
import { ThemeSwitch } from '~/components/switcher/ThemeSwitch'

export function Header() {
  return (
    <header className="sticky top-0 backdrop-blur-sm transition-colors h-16 px-4 border-b border-divider flex items-center justify-between">
      <div></div>
      <div className="flex items-center gap-2">
        <LanguageSwitch />
        <ThemeSwitch />
        <Separator className="h-6 mx-2 md:mx-0.5" orientation="vertical" />
        <UserMenu />
        <Button className="size-11 md:hidden" isIconOnly variant="tertiary">
          <PanelRightOpen className="size-5" />
        </Button>
      </div>
    </header>
  )
}

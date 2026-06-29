'use client'

import { Button, Input, Label, Switch, toast } from '@heroui/react'
import { Footer } from '~/components/layout/Footer'
import { Header } from '~/components/layout/Header'
import { Link } from '~/components/navigation/Link'
import { Popup } from '~/context/usePopupContext'
import { useTypedTranslations } from '~/hooks/useTypedTranslations'

export default function HomePage() {
  const t = useTypedTranslations()

  return (
    <div>
      <Header></Header>
      <Button onClick={() => Popup.LoginPopLayer.visible()}>{t('common.hello')}</Button>

      <Link href="/hello">hell</Link>

      <Button
        onClick={() => Popup.ImageViewer.visible({
          src: 'https://picsum.photos/3000/2000',
          images: [
            'https://picsum.photos/600/600?random=1',
            'https://picsum.photos/600/600?random=2',
            'https://picsum.photos/600/600?random=3',
          ],
          externalClose: true,
        })}
      >
        Open Picture
      </Button>

      <Button
        onPress={() => {
          Popup.ActionDialog.visible({
            title: 'Are you sure you want to delete it?',
            content: (
              <div className="space-y-2">
                <p>
                  Please enter
                  <span className="underline hover:text-accent"> confirm</span>
                  {' '}
                  to delete
                </p>
                <div className="p-1">
                  <Input fullWidth placeholder="Type here..." variant="secondary" />
                </div>
              </div>
            ),
            status: 'danger',
            confirmText: 'Delete',
            backdropClassName: 'bg-linear-to-t from-red-950/90 via-red-950/50 to-transparent dark:from-red-950/95 dark:via-red-950/60',
            onConfirm: () => new Promise((_, reject) => setTimeout(() => {
              reject(new Error('Oops, the server is down, please contact the developers.'))
            }, 2000)),
            onCancel: () => new Promise(resolve => setTimeout(resolve, 1000)),
          })
        }}
        variant="danger"
      >
        Confirm
      </Button>

      <Button
        onPress={() => {
          toast.success('You have been invited to join a team')
        }}
      >
        Toast
      </Button>

      <Switch>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label className="text-sm">Enable notifications</Label>
        </Switch.Content>
      </Switch>

      <Link href="/admin/dashboard">{t('common.name', { name: 'Jake' })}</Link>
      <Footer />
    </div>
  )
}

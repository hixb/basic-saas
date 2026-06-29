'use client'

import { Avatar, Button, buttonVariants, Popover, Spinner } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Dashboard, Logout, Profile } from '~/components/icons'
import { Link } from '~/components/navigation/Link'
import { generateAvatarBlob } from '~/lib/utils/avatar-generator'
import { cn } from '~/lib/utils/tools'

export function UserMenu() {
  const [isPending, setTransition] = useTransition()

  const [changeUser, setChangeUser] = useState(false)
  const [blobPreviewSrc, setBlobPreviewSrc] = useState<string>('')

  const change = useCallback(() => {
    setTransition(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setChangeUser(prevState => !prevState)
          resolve()
        }, 1000)
      })
    })
  }, [])

  useEffect(() => {
    const loadAvatar = async () => {
      const blob = await generateAvatarBlob()
      const previewUrl = URL.createObjectURL(blob)
      setBlobPreviewSrc(previewUrl)
    }
    void loadAvatar()
  }, [])

  return (
    <motion.div
      animate={{ width: changeUser ? 44 : 100 }}
      className="relative flex items-center justify-center overflow-hidden"
      transition={{
        duration: 0.45,
        ease: [0.32, 0.72, 0, 1],
      }}
    >
      <AnimatePresence custom={changeUser} initial={false} mode="wait">
        {changeUser
          ? (
              <motion.div
                animate="animate"
                className="relative cursor-pointer"
                custom={changeUser}
                exit="exit"
                initial="initial"
                key="avatar"
                transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                variants={{
                  initial: { opacity: 0, scale: 0.88 },
                  animate: { opacity: 1, scale: 1 },
                  exit: { opacity: 0, scale: 0.88, transition: { duration: 0.3 } },
                }}
              >
                <Popover>
                  <Popover.Trigger aria-label="User profile">
                    <Avatar>
                      <Avatar.Image alt="Online User" src={blobPreviewSrc} />
                      <Avatar.Fallback>ON</Avatar.Fallback>
                    </Avatar>
                    <span className="ring-background absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2" />
                  </Popover.Trigger>
                  <Popover.Content className="w-[320px]">
                    <Popover.Dialog>
                      <Popover.Arrow />
                      <Popover.Heading>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar size="md">
                              <Avatar.Image alt="Sarah Johnson" src={blobPreviewSrc} />
                              <Avatar.Fallback>SJ</Avatar.Fallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">Sarah Johnson</p>
                              <p className="text-muted text-sm">@sarahj</p>
                            </div>
                          </div>
                        </div>
                      </Popover.Heading>
                      <div className="mt-3 w-full space-y-1">
                        <Link
                          className={cn(buttonVariants({ variant: 'ghost', fullWidth: true }), 'h-10 justify-start')}
                          href="/admin/login"
                        >
                          <Dashboard />
                          Dashboard
                        </Link>
                        <Link
                          className={cn(buttonVariants({ variant: 'ghost', fullWidth: true }), 'h-10 justify-start')}
                          href="/profile"
                        >
                          <Profile />
                          Profile
                        </Link>
                        <Button
                          className="w-full justify-start h-10"
                          isPending={isPending}
                          onPress={change}
                          variant="danger-soft"
                        >
                          {({ isPending }) => (
                            <>
                              {isPending ? <Spinner color="current" size="sm" /> : <Logout />}
                              Log out
                            </>
                          )}
                        </Button>
                      </div>
                    </Popover.Dialog>
                  </Popover.Content>
                </Popover>
              </motion.div>
            )
          : (
              <motion.div
                animate="animate"
                className="w-full"
                custom={changeUser}
                exit="exit"
                initial="initial"
                key="button"
                transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                variants={{
                  initial: { opacity: 0, scale: 0.88 },
                  animate: { opacity: 1, scale: 1 },
                  exit: { opacity: 0, scale: 0.88, transition: { duration: 0.3 } },
                }}
              >
                <Button className="h-11 max-w-full w-full" onPress={() => setChangeUser(prevState => !prevState)}>
                  <span className="truncate">Sign In</span>
                </Button>
              </motion.div>
            )}
      </AnimatePresence>
    </motion.div>
  )
}

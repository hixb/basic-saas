'use client'

import type { FormEvent } from 'react'
import {
  Button,
  ButtonGroup,
  FieldError,
  Form,
  Input,
  Modal,
  Popover,
  Separator,
  Spinner,
  TextField,
} from '@heroui/react'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useCallback } from 'react'
import { Link } from '~/components/navigation/Link'
import { usePopup } from '~/context/usePopupContext'

export interface LoginPopLayerProps {
  /**
   * A boolean flag indicating whether an element or component is currently visible.
   * When set to `true`, the element or component is displayed; when `false`, it is hidden.
   */
  visible?: boolean
  /**
   * A callback function that is triggered when a close event occurs.
   */
  onClose?: (state: boolean) => void
  /**
   * An optional string that defines the route or path for a specific endpoint or resource.
   * It can be used to specify the URL pattern that should be matched for routing purposes.
   * If not provided, the default or a predefined route may be used depending on the context.
   */
  route?: string
}

function LoginPopLayerComponent(props: LoginPopLayerProps) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    // Convert FormData to plain object
    formData.forEach((value, key) => {
      data[key] = value.toString()
    })
    // alert(`Form submitted with: ${JSON.stringify(data, null, 2)}`)
  }

  return (
    <Modal isOpen={props.visible} onOpenChange={props.onClose}>
      <Modal.Backdrop variant="blur">
        <Modal.Container>
          <Modal.Dialog>
            {() => (
              <>
                <Modal.CloseTrigger />
                <Modal.Header className="flex flex-col gap-1 mb-4">
                  <h1 className="text-lg font-medium">Sign in to your account</h1>
                  <p className="text-sm text-muted">to continue to Acme</p>
                </Modal.Header>
                <Modal.Body>
                  <Form className="flex w-96 flex-col gap-4 p-1" onSubmit={onSubmit}>
                    <TextField
                      isRequired
                      name="email"
                      type="email"
                      validate={(value) => {
                        if (!/^[\w.%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                          return 'Please enter a valid email address'
                        }
                        return null
                      }}
                    >
                      <Input className="h-10" placeholder="john@example.com" variant="secondary" />
                      <FieldError />
                    </TextField>
                    <TextField
                      isRequired
                      minLength={8}
                      name="password"
                      type="password"
                      validate={(value) => {
                        if (value.length < 8) {
                          return 'Password must be at least 8 characters'
                        }
                        if (!/[A-Z]/.test(value)) {
                          return 'Password must contain at least one uppercase letter'
                        }
                        if (!/\d/.test(value)) {
                          return 'Password must contain at least one number'
                        }
                        return null
                      }}
                    >
                      <Input className="h-10" placeholder="Enter your password" variant="secondary" />
                      <FieldError />
                    </TextField>

                    <div className="flex gap-2">
                      <Button className="w-full h-10" type="submit">
                        Submit
                      </Button>
                    </div>

                    <div className="flex items-center gap-4">
                      <Separator className="flex-1" />
                      <span className="text-tiny text-muted shrink-0">OR</span>
                      <Separator className="flex-1" />
                    </div>

                    <div className="flex flex-col gap-2 *:w-full *:h-10">
                      <ButtonGroup className="w-full" fullWidth>
                        <Button isPending variant="tertiary">
                          {({ isPending }) => (
                            <>
                              {isPending ? <Spinner color="current" size="sm" /> : null}
                              <Image alt="Google" height={16} src="/logos/google.svg" width={16} />
                              Continue with Google
                            </>
                          )}
                        </Button>
                        <Popover>
                          <Button aria-label="More options" isIconOnly isPending variant="tertiary">
                            <ChevronDown />
                          </Button>
                          <Popover.Content className="max-w-64" placement="bottom end">
                            <Popover.Dialog>
                              <div className="gap-2 flex">
                                {['google', 'link', 'stripe'].map(v => (
                                  <Button fullWidth isIconOnly key={v} size="sm" variant="tertiary">
                                    <Image alt="Google" height={16} src={`/logos/${v}.svg`} width={16} />
                                  </Button>
                                ))}
                              </div>
                            </Popover.Dialog>
                          </Popover.Content>
                        </Popover>
                      </ButtonGroup>
                    </div>

                    <p className="text-center">
                      Don't have an account yet?
                      <Link className="ml-1 text-accent hover:underline" href="/">
                        Join us
                      </Link>
                    </p>
                  </Form>
                </Modal.Body>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export function LoginPopLayer() {
  const { popups, hidePopup } = usePopup()
  const { visible, isClosing, params, callbacks } = popups.LoginPopLayer

  const handleClose = useCallback(async (_state: boolean) => {
    await Promise.resolve(callbacks.beforeClose?.()).catch(console.error)
    hidePopup('LoginPopLayer')
  }, [hidePopup, callbacks])

  const isMounted = visible || isClosing

  if (!isMounted) {
    return null
  }

  return (
    <LoginPopLayerComponent
      {...params}
      onClose={handleClose}
      visible={visible}
    />
  )
}

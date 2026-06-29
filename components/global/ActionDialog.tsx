'use client'

import type { AlertDialogContainerProps, AlertDialogIconProps } from '@heroui/react'
import type { ReactNode } from 'react'
import { AlertDialog, Button, Spinner, toast } from '@heroui/react'
import { useCallback, useTransition } from 'react'
import { usePopup } from '~/context/usePopupContext'

export interface ActionDialogOptions {
  title?: string
  content?: ReactNode
  status?: AlertDialogIconProps['status']
  confirmText?: ReactNode
  cancelText?: string
  showCancelButton?: boolean
  showCloseButton?: boolean
  variant?: 'opaque' | 'blur' | 'transparent'
  size?: AlertDialogContainerProps['size']
  placement?: AlertDialogContainerProps['placement']
  isDismissable?: boolean
  isKeyboardDismissDisabled?: boolean
  backdropClassName?: string
  buttonDisabledStatus?: {
    cancel?: boolean
    confirm?: boolean
  } | boolean
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
}

interface ConfirmComponentProps extends ActionDialogOptions {
  visible: boolean
  onClose: (state: boolean) => void
}

function ActionDialogComponent(props: ConfirmComponentProps) {
  const {
    visible,
    onClose,
    title = 'Action',
    content = 'Are you sure you want to proceed?',
    status = 'default',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    showCancelButton = true,
    showCloseButton = true,
    variant = 'blur',
    size = 'md',
    placement = 'auto',
    isDismissable = true,
    isKeyboardDismissDisabled = false,
    backdropClassName,
    buttonDisabledStatus,
    onConfirm,
    onCancel,
  } = props

  const [isConfirmPending, startTransitionConfirm] = useTransition()
  const [isCancelPending, startTransitionCancel] = useTransition()

  const isLoading = isConfirmPending || isCancelPending
  const checkButtonType = typeof buttonDisabledStatus === 'boolean'

  const handleConfirm = useCallback(() => {
    startTransitionConfirm(async () => {
      try {
        await onConfirm?.()
        onClose(false)
      }
      catch (error) {
        toast.danger('Something went wrong~', {
          description: `Confirm callback error: ${error}`,
          timeout: 2500,
        })
        console.error('Confirm callback error:', error)
      }
    })
  }, [onConfirm, onClose])

  const handleCancel = useCallback(() => {
    startTransitionCancel(async () => {
      try {
        await onCancel?.()
        onClose(false)
      }
      catch (error) {
        toast.warning('Something went wrong~', {
          description: `Cancel callback error: ${error}`,
          timeout: 2500,
        })
        console.error('Cancel callback error:', error)
      }
    })
  }, [onCancel, onClose])

  return (
    <AlertDialog.Backdrop
      className={backdropClassName}
      isDismissable={isLoading ? false : isDismissable}
      isKeyboardDismissDisabled={isLoading ? true : isKeyboardDismissDisabled}
      isOpen={visible}
      onOpenChange={onClose}
      variant={variant}
    >
      <AlertDialog.Container placement={placement} size={size}>
        <AlertDialog.Dialog>
          {showCloseButton && <AlertDialog.CloseTrigger isPending={isLoading} />}
          <AlertDialog.Header>
            <AlertDialog.Icon status={status} />
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            {content}
          </AlertDialog.Body>
          <AlertDialog.Footer>
            {showCancelButton && (
              <Button
                isDisabled={isConfirmPending || checkButtonType || buttonDisabledStatus?.cancel}
                isPending={isCancelPending}
                onPress={handleCancel}
                variant="tertiary"
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {cancelText}
                  </>
                )}
              </Button>
            )}
            <Button
              isDisabled={isCancelPending || checkButtonType || buttonDisabledStatus?.confirm}
              isPending={isConfirmPending}
              onPress={handleConfirm}
              variant={status === 'danger' ? 'danger' : 'primary'}
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {confirmText}
                </>
              )}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  )
}

export function ActionDialog() {
  const { popups, hidePopup } = usePopup()
  const { visible, isClosing, params, callbacks } = popups.ActionDialog

  const handleClose = useCallback(async (_state: boolean) => {
    await Promise.resolve(callbacks.beforeClose?.()).catch(console.error)
    hidePopup('ActionDialog')
  }, [hidePopup, callbacks])

  const isMounted = visible || isClosing

  if (!isMounted) {
    return null
  }

  return (
    <ActionDialogComponent
      {...(params as ActionDialogOptions)}
      onClose={handleClose}
      visible={visible}
    />
  )
}

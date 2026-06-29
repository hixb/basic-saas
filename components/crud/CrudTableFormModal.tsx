'use client'

import type { AlertDialogVariants } from '@heroui/styles'
import type { ReactNode } from 'react'
import type { FieldValues } from 'react-hook-form'
import type { CrudTableHandle, RenderFormProps } from './types'
import { AlertDialog, Button, Spinner } from '@heroui/react'
import { useCallback, useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { useCrudTableCtx } from './context'

interface CrudTableFormModalProps<T, CreateInput, UpdateInput> {
  /**
   * Render function for the form body, passed as children.
   * Receives `{ mode, data, form }` and should return all field elements
   * for both create and edit modes.
   * The form is automatically reset on open: pre-filled with `data` in edit mode,
   * empty in create mode.
   *
   * @example
   * <CrudTable.FormModal handle={handle} createTitle="New User" editTitle="Edit User">
   *   {({ mode, data, form }) => (
   *     <>
   *       <TextField isRequired>
   *         <Label>Name</Label>
   *         <Input {...form.register('name', { required: true })} />
   *       </TextField>
   *       {mode === 'edit' && <p>Editing: {data?.name}</p>}
   *     </>
   *   )}
   * </CrudTable.FormModal>
   */
  children: ((props: RenderFormProps<T, CreateInput, UpdateInput>) => ReactNode) | ReactNode

  /**
   * The same handle passed to `<CrudTable handle={...} />`.
   * Not used at runtime — its sole purpose is to let TypeScript infer `T`,
   * `CreateInput`, and `UpdateInput` so that `data` inside the children render
   * function is automatically typed as `T | null` instead of `unknown | null`.
   *
   * @example
   * const handle = useCrudTable<User, CreateUserDto, UpdateUserDto>({ ... })
   *
   * <CrudTable.FormModal handle={handle}>
   *   {({ data }) => <p>{data?.username}</p>}
   *   {/* data is User | null — no cast needed *\/}
   * </CrudTable.FormModal>
   */
  handle?: CrudTableHandle<T, CreateInput, UpdateInput>

  /**
   * Width size of the modal dialog, forwarded to `AlertDialog.Container`.
   *
   * @default "md"
   *
   * @example
   * <CrudTable.FormModal size="lg" renderForm={...} />
   */
  size?: AlertDialogVariants['size']

  /**
   * Heading text shown in the modal when in create mode.
   *
   * @default "Create"
   *
   * @example
   * <CrudTable.FormModal createTitle="New User" renderForm={...} />
   */
  createTitle?: string

  /**
   * Heading text shown in the modal when in edit mode.
   *
   * @default "Edit"
   *
   * @example
   * <CrudTable.FormModal editTitle="Edit User" renderForm={...} />
   */
  editTitle?: string
}

/**
 * Create/edit form modal sub-component for `CrudTable`.
 * Registers itself in context on mount, which switches edit buttons in `CrudTable.Content`
 * from an eye icon to a pencil icon. Modal visibility, form mode (`create` | `edit`),
 * and the row being edited are all driven by `CrudTableContext`.
 *
 * Form lifecycle:
 * - Opens in **create** mode when the toolbar's create button is pressed (empty form).
 * - Opens in **edit** mode when a row's edit button is pressed (form pre-filled with row data).
 * - Resets automatically via `react-hook-form` on each open.
 * - Calls `operations.create` or `operations.update` on submit, then refreshes the list.
 *
 * @example
 * <CrudTable.FormModal createTitle="New User" editTitle="Edit User">
 *   {({ mode, data: row, form }) => {
 *     const data = row as User | null
 *     return (
 *       <>
 *         <TextField isRequired>
 *           <Label>Name</Label>
 *           <Input {...form.register('name', { required: true })} />
 *         </TextField>
 *         {mode === 'edit' && (
 *           <p className="text-sm text-muted">Editing: {data?.name}</p>
 *         )}
 *       </>
 *     )
 *   }}
 * </CrudTable.FormModal>
 */
export function CrudTableFormModal<T, CreateInput = unknown, UpdateInput = unknown>({
  children,
  size = 'md',
  createTitle = 'Create',
  editTitle = 'Edit',
  handle: _handle,
}: CrudTableFormModalProps<T, CreateInput, UpdateInput>) {
  const { handle, registerFormModal } = useCrudTableCtx()
  const { formOpen, formMode, editingRow, closeForm, handleFormSubmit } = handle as CrudTableHandle<T, CreateInput, UpdateInput>

  useEffect(() => registerFormModal(), [registerFormModal])

  type FormValues = FieldValues & CreateInput & UpdateInput

  const form = useForm<FormValues>()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!formOpen)
      return

    form.reset(formMode === 'edit' && editingRow != null
      ? editingRow as unknown as FormValues
      : {} as FormValues)
  }, [formOpen, formMode, editingRow, form])

  const onSubmit = useCallback(
    form.handleSubmit(data => startTransition(async () => await handleFormSubmit(data))),
    [form, handleFormSubmit],
  )

  const title = formMode === 'create' ? createTitle : editTitle

  return (
    <AlertDialog.Backdrop
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
      isOpen={formOpen}
      onOpenChange={(open) => {
        if (!open && !isPending)
          closeForm()
      }}
      variant="blur"
    >
      <AlertDialog.Container size={size}>
        <AlertDialog.Dialog>
          <AlertDialog.CloseTrigger isPending={isPending} />
          <AlertDialog.Header>
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <form className="flex flex-col gap-4 p-1" id="crud-form" onSubmit={onSubmit}>
              {typeof children === 'function'
                ? children({ mode: formMode, data: editingRow, form })
                : children}
            </form>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button isDisabled={isPending} onPress={closeForm} variant="tertiary">
              Cancel
            </Button>
            <Button form="crud-form" isPending={isPending} type="submit" variant="primary">
              {({ isPending: pending }) => (
                <>
                  {pending && <Spinner color="current" size="sm" />}
                  {formMode === 'create' ? 'Create' : 'Save'}
                </>
              )}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  )
}

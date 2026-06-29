'use client'

import type { JSX, ReactNode } from 'react'
import type { CrudTableCtx } from './context'
import type { ColumnDef, CrudTableHandle } from './types'
import { useCallback, useMemo, useState } from 'react'
import { cn } from '~/lib/utils/tools'
import { CrudTableContext } from './context'
import { CrudTableContent } from './CrudTableContent'
import { CrudTableFilterPanel } from './CrudTableFilterPanel'
import { CrudTableFormModal } from './CrudTableFormModal'
import { CrudTableToolbar } from './CrudTableToolbar'

interface CrudTableProps<T, CreateInput = unknown, UpdateInput = unknown> {
  /**
   * The CRUD state and action handle returned by `useCrudTable`.
   * Drives all data fetching, sorting, pagination, selection, and modal operations
   * across every sub-component via context.
   *
   * @example
   * const handle = useCrudTable({ operations, getRowId: row => row.id })
   * <CrudTable handle={handle} columns={columns}>...</CrudTable>
   */
  handle: CrudTableHandle<T, CreateInput, UpdateInput>

  /**
   * Column definitions shared across all sub-components.
   * Controls header labels, sortability, custom cell rendering, width, and row header designation.
   *
   * @example
   * const columns: ColumnDef<User>[] = [
   *   { key: 'id', label: 'ID', isRowHeader: true, width: 60 },
   *   { key: 'name', label: 'Name', sortable: true },
   *   { key: 'status', label: 'Status', render: row => <Chip>{row.status}</Chip> },
   * ]
   */
  columns: ColumnDef<T>[]

  /**
   * Sub-components to render inside the table layout.
   * Any combination of `CrudTable.Toolbar`, `CrudTable.FilterPanel`,
   * `CrudTable.Content`, and `CrudTable.FormModal` is accepted.
   *
   * @example
   * <CrudTable handle={handle} columns={columns}>
   *   <CrudTable.Toolbar createLabel="New User" />
   *   <CrudTable.Content expandable />
   * </CrudTable>
   */
  children: ReactNode
}

function CrudTableRoot<T, CreateInput = unknown, UpdateInput = unknown>({
  handle,
  columns,
  children,
}: CrudTableProps<T, CreateInput, UpdateInput>): JSX.Element {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null)
  const [hasFilterPanel, setHasFilterPanel] = useState(false)
  const [hasFormModal, setHasFormModal] = useState(false)

  const registerFilterPanel = useCallback(() => {
    setHasFilterPanel(true)
    return () => setHasFilterPanel(false)
  }, [])

  const registerFormModal = useCallback(() => {
    setHasFormModal(true)
    return () => setHasFormModal(false)
  }, [])

  const ctx = useMemo<CrudTableCtx>(() => ({
    handle: handle as CrudTableHandle<unknown, unknown, unknown>,
    columns: columns as ColumnDef<unknown>[],
    filterPanelOpen,
    setFilterPanelOpen,
    expandedRowId,
    setExpandedRowId,
    hasFilterPanel,
    hasFormModal,
    registerFilterPanel,
    registerFormModal,
  }), [
    handle,
    columns,
    filterPanelOpen,
    expandedRowId,
    hasFilterPanel,
    hasFormModal,
    registerFilterPanel,
    registerFormModal,
  ])

  return (
    <CrudTableContext.Provider value={ctx}>
      <div
        className={cn(
          'flex flex-col gap-0',
          handle.loading && handle.items.length > 0 && 'pointer-events-none opacity-60 transition-opacity',
        )}
      >
        {children}
      </div>
    </CrudTableContext.Provider>
  )
}

CrudTableRoot.Toolbar = CrudTableToolbar
CrudTableRoot.FilterPanel = CrudTableFilterPanel
CrudTableRoot.Content = CrudTableContent
CrudTableRoot.FormModal = CrudTableFormModal

/**
 * Root compound component for the CRUD table system.
 * Initialises shared context (handle, columns, UI state) and distributes it
 * to all sub-components via `CrudTableContext`.
 *
 * Sub-components:
 * - `CrudTable.Toolbar`     — create / batch-delete / refresh / filter-toggle buttons
 * - `CrudTable.FilterPanel` — collapsible filter panel (auto-wired to toolbar toggle)
 * - `CrudTable.Content`     — table headers, rows, expandable details, and pagination
 * - `CrudTable.FormModal`   — create / edit modal (auto-enables pencil icon on edit buttons)
 *
 * @example
 * // Minimal — table with create and delete
 * <CrudTable handle={handle} columns={columns}>
 *   <CrudTable.Toolbar />
 *   <CrudTable.Content />
 * </CrudTable>
 *
 * @example
 * // Full — filters, expandable rows, and a create/edit form modal
 * <CrudTable handle={handle} columns={columns}>
 *   <CrudTable.Toolbar createLabel="New User" />
 *   <CrudTable.FilterPanel>
 *     <CrudTable.FilterPanel.Content onApply={apply} onClear={clear}>
 *       <Select placeholder="Status" onChange={v => setField('status', v)}>...</Select>
 *     </CrudTable.FilterPanel.Content>
 *   </CrudTable.FilterPanel>
 *   <CrudTable.Content expandable renderDetail={row => <UserProfile user={row} />} />
 *   <CrudTable.FormModal
 *     createTitle="New User"
 *     editTitle="Edit User"
 *     renderForm={({ form }) => (
 *       <TextField isRequired>
 *         <Label>Name</Label>
 *         <Input {...form.register('name')} />
 *       </TextField>
 *     )}
 *   />
 * </CrudTable>
 */
export const CrudTable: (<T, CreateInput = unknown, UpdateInput = unknown>(
  props: CrudTableProps<T, CreateInput, UpdateInput>,
) => JSX.Element) & {
  Toolbar: typeof CrudTableToolbar
  FilterPanel: typeof CrudTableFilterPanel
  Content: typeof CrudTableContent
  FormModal: typeof CrudTableFormModal
} = CrudTableRoot as any

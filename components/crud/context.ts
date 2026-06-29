import type { ColumnDef, CrudTableHandle } from './types'
import { createContext, use } from 'react'

export interface CrudTableCtx {
  /**
   * The CRUD state and action handle returned by `useCrudTable`.
   * Single source of truth for list data, pagination, sort, selection, and mutations.
   * Typed as `unknown` generics at the context level; each sub-component casts to its concrete `T`.
   */
  handle: CrudTableHandle<unknown, unknown, unknown>

  /**
   * Column definitions driving header labels, sort, custom cell rendering, and width.
   * Typed as `unknown` at the context level; sub-components cast to `ColumnDef<T>[]`.
   */
  columns: ColumnDef<unknown>[]

  /**
   * Whether the collapsible filter panel is currently expanded.
   * Toggled by `CrudTable.Toolbar` and read by `CrudTable.FilterPanel`.
   *
   * @default false
   */
  filterPanelOpen: boolean

  /**
   * Sets or toggles the filter panel open state.
   * Accepts a boolean or a functional updater `(prev) => next`.
   *
   * @example
   * // Toggle
   * setFilterPanelOpen(prev => !prev)
   *
   * @example
   * // Force close
   * setFilterPanelOpen(false)
   */
  setFilterPanelOpen: (updater: boolean | ((prev: boolean) => boolean)) => void

  /**
   * The row ID of the currently expanded detail panel, or `null` when no row is expanded.
   * Managed by `CrudTable.Content` and shared so other sub-components can react to it.
   *
   * @default null
   */
  expandedRowId: string | number | null

  /**
   * Expands the detail panel for the given row ID, or collapses it when `null` is passed.
   *
   * @example
   * // Expand row with id 42
   * setExpandedRowId(42)
   *
   * @example
   * // Collapse the currently expanded row
   * setExpandedRowId(null)
   */
  setExpandedRowId: (id: string | number | null) => void

  /**
   * `true` once `CrudTable.FilterPanel` has mounted and registered itself.
   * Used by `CrudTable.Toolbar` to decide whether to render the Filters toggle button.
   *
   * @default false
   */
  hasFilterPanel: boolean

  /**
   * `true` once `CrudTable.FormModal` has mounted and registered itself.
   * Used by `CrudTable.Content` to decide whether to render a pencil (form available)
   * or eye (view-only) icon on the edit action button.
   *
   * @default false
   */
  hasFormModal: boolean

  /**
   * Called by `CrudTable.FilterPanel` on mount to announce its presence.
   * Sets `hasFilterPanel` to `true` and returns a cleanup function that resets it on unmount.
   *
   * @example
   * // Inside CrudTableFilterPanel
   * useEffect(() => registerFilterPanel(), [registerFilterPanel])
   *
   * @returns Cleanup function to call on unmount.
   */
  registerFilterPanel: () => () => void

  /**
   * Called by `CrudTable.FormModal` on mount to announce its presence.
   * Sets `hasFormModal` to `true` and returns a cleanup function that resets it on unmount.
   *
   * @example
   * // Inside CrudTableFormModal
   * useEffect(() => registerFormModal(), [registerFormModal])
   *
   * @returns Cleanup function to call on unmount.
   */
  registerFormModal: () => () => void
}

export const CrudTableContext = createContext<CrudTableCtx | null>(null)

/**
 * Returns the nearest `CrudTable` context value.
 * Must be called inside a component rendered within a `<CrudTable>` tree.
 *
 * @throws {Error} When called outside of a `<CrudTable>` provider.
 *
 * @example
 * function MySubComponent() {
 *   const { handle, filterPanelOpen } = useCrudTableCtx()
 *   // ...
 * }
 */
export function useCrudTableCtx(): CrudTableCtx {
  const ctx = use(CrudTableContext)

  if (!ctx)
    throw new Error('CrudTable sub-components must be used within <CrudTable>')

  return ctx
}

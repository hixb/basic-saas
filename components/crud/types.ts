import type { Selection, SortDescriptor } from '@heroui/react'
import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'

/**
 * Defines a single column in the CRUD table.
 *
 * @template T - The row data type.
 */
export interface ColumnDef<T> {
  /**
   * Unique column identifier. Should match a key of `T` for automatic value
   * rendering, or use a custom string (e.g. `'actions'`) when a `render`
   * function is provided.
   */
  key: string

  /** Display label shown in the column header. */
  label: string

  /**
   * When `true`, the column header becomes clickable and passes sort state
   * to `Table.Content`. Requires the `key` to be sent as the sort column.
   * @default false
   */
  sortable?: boolean

  /**
   * Marks this column as the row header for accessibility purposes.
   * At most one column per table should have this flag set.
   * @default false
   */
  isRowHeader?: boolean

  /**
   * Fixed or CSS width applied to the column (e.g. `120`, `'10%'`).
   * When `resizable` is `true` this value is passed as `defaultWidth` to
   * `Table.Column` instead of an inline style. Defaults to `'1fr'` for
   * resizable columns when omitted.
   */
  width?: string | number

  /**
   * When `true`, renders a `Table.ColumnResizer` drag handle on the column
   * header and passes the width as `defaultWidth` so React Aria can track
   * the user-adjusted size.
   * @default false
   */
  resizable?: boolean

  /**
   * Minimum pixel width enforced while the user drags the column resizer.
   * Only meaningful when `resizable` is `true`.
   * @default 60
   */
  minWidth?: number

  /** Additional Tailwind / CSS class names applied to every cell in this column. */
  className?: string

  /**
   * Custom cell renderer. When provided, the return value is rendered instead
   * of the raw field value.
   *
   * @param row - The full row data object for this cell.
   * @returns A React node to display inside the cell.
   */
  render?: (row: T) => ReactNode
}

/**
 * Query parameters forwarded to the `list` API operation on every fetch.
 * All fields except `page` and `pageSize` are optional — the API should
 * treat absent values as "no filter / no sort".
 */
export interface ListParams {
  /** 1-based page index. */
  page: number

  /** Number of rows per page. */
  pageSize: number

  /**
   * Active sort descriptor. When `undefined` no server-side ordering is
   * requested (the API may apply a default order).
   */
  sort?: { column: string, direction: 'ascending' | 'descending' }

  /**
   * Free-text search keyword. Maps to the global search input in the toolbar.
   * When `undefined` or empty the keyword filter is omitted from the request.
   */
  keyword?: string

  /**
   * Arbitrary key/value filter map populated by the `renderFilters` slot.
   * Each entry corresponds to one filter dimension (e.g. `{ status: 'active' }`).
   * When `undefined` or empty no additional filters are applied.
   */
  filters?: Record<string, unknown>
}

/**
 * Shape of the data returned by the `list` operation.
 *
 * @template T - The row data type.
 */
export interface ListResult<T> {
  /** The rows for the current page. */
  items: T[]

  /** Total number of records across all pages (used to compute `totalPages`). */
  total: number
}

/**
 * API operations wired into the CRUD table. Only `list` is required; the
 * remaining operations are optional and enable the corresponding UI controls
 * (create button, edit button, delete button, batch-delete button).
 *
 * @template T           - The row data type.
 * @template CreateInput - Payload type for the create operation.
 * @template UpdateInput - Payload type for the update operation.
 */
export interface CrudOperations<T, CreateInput = unknown, UpdateInput = unknown> {
  /**
   * Fetches a paginated list of rows.
   *
   * @param params - Pagination, sort, keyword, and filter parameters.
   * @returns A promise resolving to the current page's items and the total count.
   */
  list: (params: ListParams) => Promise<ListResult<T>>

  /**
   * Creates a new record.
   * When provided, the toolbar renders a "Create" button and the form modal
   * is shown in create mode on press.
   *
   * @param data - The validated form payload.
   */
  create?: (data: CreateInput) => Promise<unknown>

  /**
   * Updates an existing record by ID.
   * When provided, each row renders an edit icon button that opens the form
   * modal pre-filled with the row's current data.
   *
   * @param id   - The unique identifier of the record to update.
   * @param data - The validated form payload.
   */
  update?: (id: string | number, data: UpdateInput) => Promise<unknown>

  /**
   * Deletes a single record by ID.
   * When provided, each row renders a delete icon button with a confirmation
   * dialog before the actual deletion.
   *
   * @param id - The unique identifier of the record to delete.
   */
  delete?: (id: string | number) => Promise<unknown>

  /**
   * Deletes multiple records in one request.
   * When provided, the toolbar reveals a "Delete Selected" button whenever
   * one or more rows are checked. Falls back to sequential individual
   * `delete` calls when `batchDelete` is absent but `delete` is present.
   *
   * @param ids - Array of unique identifiers to delete.
   */
  batchDelete?: (ids: Array<string | number>) => Promise<unknown>
}

/**
 * Configuration passed to `useCrudTable` to initialise the CRUD state machine.
 *
 * @template T           - The row data type.
 * @template CreateInput - Payload type for the create operation.
 * @template UpdateInput - Payload type for the update operation.
 */
export interface UseCrudTableConfig<T, CreateInput = unknown, UpdateInput = unknown> {
  /** The set of API operations available for this resource. */
  operations: CrudOperations<T, CreateInput, UpdateInput>

  /**
   * Extracts the unique identifier from a row. Used as the React `key` and
   * as the `id` argument to `delete` / `update` operations.
   *
   * @param row - A row from the current page.
   * @returns A string or number that uniquely identifies the row.
   */
  getRowId: (row: T) => string | number

  /**
   * Number of rows displayed per page.
   * @default 10
   */
  defaultPageSize?: number

  /**
   * When `true`, a checkbox column is prepended to the table and the toolbar
   * shows a "Delete Selected" button when at least one row is checked.
   * @default false
   */
  selectable?: boolean

  /**
   * When `true`, the current pagination page, sort column/direction, keyword,
   * and filter values are synchronised with the browser URL as search params.
   * This makes table state fully shareable via URL — recipients visiting the
   * link will see an identical 1:1 view of the table.
   *
   * URL param conventions:
   * - `page`   → current page number (omitted when page === 1)
   * - `keyword` → search keyword
   * - `sort`   → sorted column key
   * - `dir`    → sort direction (`ascending` | `descending`)
   * - `f_*`    → each filter key prefixed with `f_` (e.g. `f_status=active`)
   *
   * Requires the consuming component tree to be wrapped in a `<Suspense>`
   * boundary because `useSearchParams()` suspends in Next.js App Router.
   * @default false
   */
  syncUrl?: boolean
}

/**
 * The full state and action surface returned by `useCrudTable`.
 * Pass this object directly to `<CrudTable handle={...} />`.
 *
 * @template T           - The row data type.
 * @template CreateInput - Payload type for the create operation.
 * @template UpdateInput - Payload type for the update operation.
 */
export interface CrudTableHandle<T, CreateInput = unknown, UpdateInput = unknown> {
  /** Rows for the current page, populated after a successful `list` call. */
  items: T[]

  /** `true` while a `list` request is in-flight. */
  loading: boolean

  /** Non-null when the last `list` request failed; `null` otherwise. */
  error: Error | null

  /** Current pagination state: 1-based `page`, `pageSize`, and `total` record count. */
  pagination: { page: number, pageSize: number, total: number }

  /** Active sort descriptor, or `undefined` when no column is sorted. */
  sort: SortDescriptor | undefined

  /** Current value of the search keyword input. */
  keyword: string

  /** Current filter values set via the `renderFilters` slot. */
  filters: Record<string, unknown>

  /** Set of currently selected row keys (or the string `'all'`). */
  selectedKeys: Selection

  /** Current form dialog mode — `'create'` when adding a new row, `'edit'` when modifying one. */
  formMode: 'create' | 'edit'

  /** `true` when the create/edit form modal is visible. */
  formOpen: boolean

  /** The row being edited, or `null` when in create mode or the form is closed. */
  editingRow: T | null

  /** Mirrors the `selectable` config option; consumed by `<CrudTable>` to render the checkbox column. */
  selectable: boolean

  /** Reference to the bound operations object; consumed internally by `<CrudTable>`. */
  operations: CrudOperations<T, CreateInput, UpdateInput>

  /**
   * Navigates to the given page number and triggers a new `list` request.
   * @param page - 1-based target page index.
   */
  setPage: (page: number) => void

  /**
   * Applies a new sort descriptor and resets the page to 1.
   * @param sort - The column and direction to sort by.
   */
  setSort: (sort: SortDescriptor) => void

  /**
   * Updates the keyword filter and resets the page to 1.
   * Typically called from the debounced search input.
   * @param keyword - The new search string.
   */
  setKeyword: (keyword: string) => void

  /**
   * Replaces the entire filter map and resets the page to 1.
   * @param filters - New filter key/value pairs.
   */
  setFilters: (filters: Record<string, unknown>) => void

  /**
   * Changes the number of rows shown per page and resets to page 1.
   * @param pageSize - The new page size.
   */
  setPageSize: (pageSize: number) => void

  /**
   * Updates the set of checked row keys.
   * @param keys - The new selection (a `Set<Key>` or the string `'all'`).
   */
  setSelectedKeys: (keys: Selection) => void

  /** Re-runs the current `list` request with the same parameters. */
  refresh: () => void

  /** Opens the form modal in create mode with an empty form. */
  openCreate: () => void

  /**
   * Opens the form modal in edit mode, pre-filling the form with `row`'s data.
   * @param row - The row to edit.
   */
  openEdit: (row: T) => void

  /** Closes the form modal and clears `editingRow`. */
  closeForm: () => void

  /**
   * Shows a confirmation dialog, then calls `operations.delete` on approval
   * and refreshes the list.
   * @param id - The unique identifier of the row to delete.
   */
  handleDelete: (id: string | number) => void

  /**
   * Shows a confirmation dialog, then calls `operations.batchDelete` (or
   * sequential `operations.delete` calls) for all selected rows on approval
   * and refreshes the list.
   */
  handleBatchDelete: () => void

  /**
   * Called when the form modal is submitted. Invokes `operations.create` or
   * `operations.update` depending on `formMode`, then refreshes and closes
   * the modal.
   * @param data - The validated form payload.
   */
  handleFormSubmit: (data: CreateInput | UpdateInput) => Promise<void>
}

/**
 * Props injected into the `renderForm` render-prop function by `<CrudFormModal>`.
 *
 * @template T           - The row data type.
 * @template CreateInput - Payload type for the create operation.
 * @template UpdateInput - Payload type for the update operation.
 */
export interface RenderFormProps<T, CreateInput, UpdateInput> {
  /**
   * The current dialog mode.
   * - `'create'` — the form is blank; submission calls `operations.create`.
   * - `'edit'`   — the form is pre-filled; submission calls `operations.update`.
   */
  mode: 'create' | 'edit'

  /**
   * The row currently being edited, or `null` when `mode === 'create'`.
   * Use this to read the original values for display or comparison.
   */
  data: T | null

  /**
   * The `react-hook-form` instance managing the form state.
   * Register fields with `form.register('fieldName')` and read errors via
   * `form.formState.errors`.
   */
  form: UseFormReturn<any>

  /** Type-only phantom field — not available at runtime; used for IDE inference. */
  createInput?: CreateInput

  /** Type-only phantom field — not available at runtime; used for IDE inference. */
  updateInput?: UpdateInput
}

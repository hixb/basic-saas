'use client'

import type { Selection, SortDescriptor } from '@heroui/react'
import type { CrudTableHandle, ListResult, UseCrudTableConfig } from '~/components/crud/types'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { Popup } from '~/context/usePopupContext'

type Status = 'idle' | 'loading' | 'error'

/**
 * Internal reducer state for `useCrudTable`.
 *
 * @template T - The row/entity type returned by the list operation.
 */
interface State<T> {
  /** Current fetch lifecycle status for the list request. */
  status: Status
  /** Rows for the active page. */
  items: T[]
  /** Total number of rows across all pages. */
  total: number
  /** Current 1-based page index. */
  page: number
  /** Number of rows per page. */
  pageSize: number
  /** Active sort descriptor; `undefined` means no explicit sorting. */
  sort: SortDescriptor | undefined
  /** Current global keyword search value. */
  keyword: string
  /** Arbitrary filter map keyed by filter name. */
  filters: Record<string, unknown>
  /** Current table row selection state (`Set` or `'all'`). */
  selectedKeys: Selection
  /** Whether the create/edit modal is open. */
  formOpen: boolean
  /** Current form mode when the modal is open. */
  formMode: 'create' | 'edit'
  /** The row currently being edited, or `null` in create mode. */
  editingRow: T | null
  /** Last request error, or `null` when there is no error. */
  error: Error | null
  /** Abort controller for the in-flight list request, if any. */
  abortController: AbortController | null
}

type Action<T>
  = | { type: 'FETCH_START', abortController: AbortController }
    | { type: 'FETCH_SUCCESS', items: T[], total: number, abortController: AbortController }
    | { type: 'FETCH_ERROR', error: Error, abortController: AbortController }
    | { type: 'SET_PAGE', page: number }
    | { type: 'SET_SORT', sort: SortDescriptor }
    | { type: 'SET_KEYWORD', keyword: string }
    | { type: 'SET_FILTERS', filters: Record<string, unknown> }
    | { type: 'SET_PAGE_SIZE', pageSize: number }
    | { type: 'SET_SELECTED_KEYS', keys: Selection }
    | { type: 'OPEN_CREATE' }
    | { type: 'OPEN_EDIT', row: T }
    | { type: 'CLOSE_FORM' }

function buildInitialState<T>(
  pageSize: number,
  page: number,
  keyword: string,
  sort: SortDescriptor | undefined,
  filters: Record<string, unknown>,
): State<T> {
  return {
    status: 'idle',
    items: [],
    total: 0,
    page,
    pageSize,
    sort,
    keyword,
    filters,
    selectedKeys: new Set(),
    formOpen: false,
    formMode: 'create',
    editingRow: null,
    error: null,
    abortController: null,
  }
}

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'FETCH_START':
      state.abortController?.abort()
      return { ...state, status: 'loading', error: null, abortController: action.abortController }
    case 'FETCH_SUCCESS':
      if (action.abortController !== state.abortController)
        return state
      return {
        ...state,
        status: 'idle',
        items: action.items,
        total: action.total,
        abortController: null,
        selectedKeys: new Set(),
      }
    case 'FETCH_ERROR':
      if (action.abortController !== state.abortController)
        return state
      return { ...state, status: 'error', error: action.error, abortController: null }
    case 'SET_PAGE':
      return { ...state, page: action.page }
    case 'SET_SORT':
      return { ...state, sort: action.sort, page: 1 }
    case 'SET_KEYWORD':
      return { ...state, keyword: action.keyword, page: 1 }
    case 'SET_FILTERS':
      return { ...state, filters: action.filters, page: 1 }
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.pageSize, page: 1 }
    case 'SET_SELECTED_KEYS':
      return { ...state, selectedKeys: action.keys }
    case 'OPEN_CREATE':
      return { ...state, formOpen: true, formMode: 'create', editingRow: null }
    case 'OPEN_EDIT':
      return { ...state, formOpen: true, formMode: 'edit', editingRow: action.row }
    case 'CLOSE_FORM':
      return { ...state, formOpen: false, editingRow: null }
    default:
      return state
  }
}

const URL_SORT_KEY = 'sort'
const URL_DIR_KEY = 'dir'
const URL_KEYWORD_KEY = 'keyword'
const URL_PAGE_KEY = 'page'
const URL_FILTER_PREFIX = ''

function parseUrlState(searchParams: URLSearchParams, defaultPageSize: number) {
  const page = Math.max(1, Number(searchParams.get(URL_PAGE_KEY) ?? 1))
  const keyword = searchParams.get(URL_KEYWORD_KEY) ?? ''
  const sortCol = searchParams.get(URL_SORT_KEY)
  const sortDir = searchParams.get(URL_DIR_KEY) as 'ascending' | 'descending' | null
  const sort: SortDescriptor | undefined = sortCol ? { column: sortCol, direction: sortDir ?? 'ascending' } : undefined

  const filters: Record<string, unknown> = {}
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith(URL_FILTER_PREFIX)) {
      filters[key.slice(URL_FILTER_PREFIX.length)] = value
    }
  }

  return {
    page,
    keyword,
    sort,
    filters,
    pageSize: defaultPageSize,
  }
}

function buildSearchParams(state: Pick<State<unknown>, 'page' | 'keyword' | 'sort' | 'filters'>): string {
  const params = new URLSearchParams()
  if (state.page > 1) {
    params.set(URL_PAGE_KEY, String(state.page))
  }
  if (state.keyword) {
    params.set(URL_KEYWORD_KEY, state.keyword)
  }
  if (state.sort) {
    params.set(URL_SORT_KEY, String(state.sort.column))
    params.set(URL_DIR_KEY, state.sort.direction ?? 'ascending')
  }
  for (const [key, value] of Object.entries(state.filters)) {
    if (value != null && value !== '')
      params.set(`${URL_FILTER_PREFIX}${key}`, String(value))
  }

  const qs = params.toString()

  return qs ? `?${qs}` : ''
}

export function useCrudTable<T, CreateInput = unknown, UpdateInput = unknown>(
  config: UseCrudTableConfig<T, CreateInput, UpdateInput>,
): CrudTableHandle<T, CreateInput, UpdateInput> {
  const {
    operations,
    getRowId,
    defaultPageSize = 10,
    selectable = false,
    syncUrl = false,
  } = config

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Parse initial state from URL on first render
  const initialUrlState = useMemo(() => {
    return !syncUrl
      ? { page: 1, keyword: '', sort: undefined, filters: {} }
      : parseUrlState(searchParams, defaultPageSize)
  }, [])

  const [state, dispatch] = useReducer(
    reducer<T>,
    buildInitialState<T>(
      defaultPageSize,
      initialUrlState.page,
      initialUrlState.keyword,
      initialUrlState.sort,
      initialUrlState.filters,
    ),
  )

  // Keep operations ref stable to avoid effect re-runs
  const operationsRef = useRef(operations)
  useEffect(() => {
    operationsRef.current = operations
  }, [operations])

  const fetchData = useCallback(() => {
    const abortController = new AbortController()
    dispatch({ type: 'FETCH_START', abortController })

    operationsRef.current
      .list({
        page: state.page,
        pageSize: state.pageSize,
        sort: state.sort as { column: string, direction: 'ascending' | 'descending' } | undefined,
        keyword: state.keyword || undefined,
        filters: Object.keys(state.filters).length ? state.filters : undefined,
      })
      .then((result: ListResult<T>) => {
        if (!abortController.signal.aborted) {
          dispatch({ type: 'FETCH_SUCCESS', items: result.items, total: result.total, abortController })
        }
      })
      .catch((error: unknown) => {
        if (!abortController.signal.aborted) {
          dispatch({
            type: 'FETCH_ERROR',
            error: error instanceof Error ? error : new Error(String(error)),
            abortController,
          })
        }
      })

    return () => abortController.abort()
  }, [state.page, state.pageSize, state.sort, state.keyword, state.filters])

  useEffect(() => {
    return fetchData()
  }, [fetchData])

  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (!syncUrl)
      return

    // Skip the very first render to avoid a redundant replace on mount
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    const qs = buildSearchParams({
      page: state.page,
      keyword: state.keyword,
      sort: state.sort,
      filters: state.filters,
    })

    router.replace(`${pathname}${qs}`, { scroll: false })
  }, [syncUrl, state.page, state.keyword, state.sort, state.filters, pathname, router])

  const setPage = useCallback((page: number) => dispatch({ type: 'SET_PAGE', page }), [])
  const setSort = useCallback((sort: SortDescriptor) => dispatch({ type: 'SET_SORT', sort }), [])
  const setKeyword = useCallback((keyword: string) => dispatch({ type: 'SET_KEYWORD', keyword }), [])
  const setFilters = useCallback((filters: Record<string, unknown>) => dispatch({ type: 'SET_FILTERS', filters }), [])
  const setPageSize = useCallback((pageSize: number) => dispatch({ type: 'SET_PAGE_SIZE', pageSize }), [])
  const setSelectedKeys = useCallback((keys: Selection) => dispatch({ type: 'SET_SELECTED_KEYS', keys }), [])
  const refresh = useCallback(() => fetchData(), [fetchData])
  const openCreate = useCallback(() => dispatch({ type: 'OPEN_CREATE' }), [])
  const openEdit = useCallback((row: T) => dispatch({ type: 'OPEN_EDIT', row }), [])
  const closeForm = useCallback(() => dispatch({ type: 'CLOSE_FORM' }), [])

  const handleDelete = useCallback((id: string | number) => {
    Popup.ActionDialog.visible({
      title: 'Delete',
      content: 'Are you sure you want to delete this item? This action cannot be undone.',
      status: 'danger',
      confirmText: 'Delete',
      backdropClassName: 'bg-danger-overlay',
      onConfirm: async () => {
        await operationsRef.current.delete?.(id)
        fetchData()
      },
    })
  }, [fetchData])

  const handleBatchDelete = useCallback(() => {
    const keys = state.selectedKeys

    if (keys instanceof Set && keys.size === 0)
      return

    const ids = keys === 'all' ? state.items.map(row => getRowId(row)) : Array.from(keys)

    Popup.ActionDialog.visible({
      title: 'Delete Selected',
      content: `Are you sure you want to delete ${ids.length} item(s)? This action cannot be undone.`,
      status: 'danger',
      confirmText: 'Delete All',
      backdropClassName: 'bg-danger-overlay',
      onConfirm: async () => {
        operationsRef.current.batchDelete
          ? await operationsRef.current.batchDelete(ids)
          : await Promise.all(ids.map(id => operationsRef.current.delete?.(id)))

        fetchData()
        dispatch({ type: 'SET_SELECTED_KEYS', keys: new Set() })
      },
    })
  }, [state.selectedKeys, state.items, getRowId, fetchData])

  const handleFormSubmit = useCallback(async (data: CreateInput | UpdateInput) => {
    if (state.formMode === 'create') {
      await operationsRef.current.create?.(data as CreateInput)
    }
    else if (state.editingRow != null) {
      const id = getRowId(state.editingRow)
      await operationsRef.current.update?.(id, data as UpdateInput)
    }

    fetchData()
    closeForm()
  }, [state.formMode, state.editingRow, getRowId, fetchData, closeForm])

  return {
    items: state.items,
    loading: state.status === 'loading',
    error: state.error,
    pagination: {
      page: state.page,
      pageSize: state.pageSize,
      total: state.total,
    },
    sort: state.sort,
    keyword: state.keyword,
    filters: state.filters,
    selectedKeys: state.selectedKeys,
    formMode: state.formMode,
    formOpen: state.formOpen,
    editingRow: state.editingRow,
    selectable,
    operations,
    setPage,
    setSort,
    setKeyword,
    setFilters,
    setPageSize,
    setSelectedKeys,
    refresh,
    openCreate,
    openEdit,
    closeForm,
    handleDelete,
    handleBatchDelete,
    handleFormSubmit,
  }
}

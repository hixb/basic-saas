'use client'

import type { Selection, SortDescriptor } from '@heroui/react'
import type { ReactNode } from 'react'
import type { ColumnDef, CrudTableHandle } from './types'
import { Button, Card, Checkbox, EmptyState, Label, ListBox, Pagination, Select, Spinner, Table } from '@heroui/react'
import { ChevronDown, ChevronUp, Eye, PackageOpen, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { cn } from '~/lib/utils/tools'
import { useCrudTableCtx } from './context'

const DETAIL_ROW_SUFFIX = '--detail'
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

interface SortableHeaderProps {
  children: ReactNode
  sortDirection?: 'ascending' | 'descending'
}

function SortableHeader({ children, sortDirection }: SortableHeaderProps) {
  return (
    <span className="flex items-center justify-between gap-1">
      {children}
      {sortDirection && (
        <ChevronUp
          className={cn(
            'size-3 shrink-0 transition-transform duration-100',
            sortDirection === 'descending' ? 'rotate-180' : '',
          )}
        />
      )}
    </span>
  )
}

function SkeletonCell({ className }: { className?: string }) {
  return (
    <div className={cn('h-4 animate-pulse rounded bg-muted/30', className ?? 'w-full')} />
  )
}

interface CrudTableContentProps<T> {
  /**
   * Accessible label applied to the `<table>` element for screen readers.
   *
   * @default "Data table"
   *
   * @example
   * <CrudTable.Content aria-label="Users" />
   */
  'aria-label'?: string

  /**
   * Visual style variant forwarded to the underlying `<Table>` component.
   *
   * @default "primary"
   *
   * @example
   * <CrudTable.Content variant="secondary" />
   */
  'variant'?: 'primary' | 'secondary'

  /**
   * When `true`, each row renders a chevron button that toggles a detail panel below it.
   * Automatically enabled when `renderDetail` is provided — no need to set both.
   *
   * @example
   * // Default key-value grid detail
   * <CrudTable.Content expandable />
   *
   * @example
   * // Custom detail with renderDetail
   * <CrudTable.Content renderDetail={row => <UserProfile user={row} />} />
   */
  'expandable'?: boolean

  /**
   * Custom renderer for the expanded row detail panel.
   * Receives the full row data and returns any React node.
   * When omitted and `expandable` is `true`, a default key-value grid is shown.
   *
   * @example
   * <CrudTable.Content
   *   renderDetail={row => (
   *     <div className="grid grid-cols-3 gap-4">
   *       <p>Email: {row.email}</p>
   *       <p>Role: {row.role}</p>
   *     </div>
   *   )}
   * />
   */
  'renderDetail'?: (row: T) => ReactNode

  /**
   * Custom action buttons appended to the right of the built-in edit and delete buttons.
   * Receives the row data and its resolved ID.
   *
   * @example
   * <CrudTable.Content
   *   renderActions={({ row, rowId }) => (
   *     <Button size="sm" variant="tertiary" onPress={() => openLogs(rowId)}>
   *       Logs
   *     </Button>
   *   )}
   * />
   */
  'renderActions'?: (params: { row: T, rowId: string | number }) => ReactNode
}

/**
 * Main table sub-component for `CrudTable`.
 * Renders the sticky column header row, data rows with skeleton loading state,
 * optional expandable detail panels, and a sticky pagination footer.
 * All data, sort, selection, and pagination state are sourced from `CrudTableContext`.
 *
 * Edit button icon:
 * - **Pencil** — when `CrudTable.FormModal` is mounted (form available).
 * - **Eye**    — when no `CrudTable.FormModal` is present (view-only trigger).
 *
 * @example
 * // Minimal
 * <CrudTable.Content />
 *
 * @example
 * // Expandable rows with a custom detail panel
 * <CrudTable.Content
 *   expandable
 *   renderDetail={row => (
 *     <div className="grid grid-cols-3 gap-4 text-sm">
 *       <p>Email: {row.email}</p>
 *       <p>Role: {row.role}</p>
 *     </div>
 *   )}
 * />
 *
 * @example
 * // Custom action buttons appended to each row
 * <CrudTable.Content
 *   renderActions={({ rowId }) => (
 *     <Button size="sm" variant="tertiary" onPress={() => openLogs(rowId)}>
 *       Logs
 *     </Button>
 *   )}
 * />
 */
export function CrudTableContent<T>({
  'aria-label': ariaLabel = 'Data table',
  variant = 'primary',
  expandable,
  renderDetail,
  renderActions,
}: CrudTableContentProps<T>) {
  const { handle, columns, expandedRowId, setExpandedRowId, hasFormModal } = useCrudTableCtx()

  const {
    items,
    loading,
    pagination,
    sort,
    selectedKeys,
    selectable,
    operations,
    setPage,
    setSort,
    setPageSize,
    setSelectedKeys,
    openEdit,
    handleDelete,
  } = handle as CrudTableHandle<T>

  const typedColumns = columns as ColumnDef<T>[]
  const isExpandable = expandable || !!renderDetail

  const { page, pageSize, total } = pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const pageNumbers = useMemo<(number | 'ellipsis')[]>(() => {
    if (totalPages <= 1)
      return [1]

    const pages: (number | 'ellipsis')[] = [1]

    if (page > 3)
      pages.push('ellipsis')

    const rangeStart = Math.max(2, page - 1)
    const rangeEnd = Math.min(totalPages - 1, page + 1)

    for (let i = rangeStart; i <= rangeEnd; i++)
      pages.push(i)

    if (page < totalPages - 2)
      pages.push('ellipsis')

    pages.push(totalPages)

    return pages
  }, [page, totalPages])

  const hasActions = !!(operations.update ?? operations.delete ?? renderActions)
  const isInitialLoading = loading && items.length === 0
  const skeletonRows = useMemo(() => Array.from({ length: pageSize }, (_, i) => i), [pageSize])

  const rowIdKey = useMemo(
    () => String((typedColumns.find(c => c.isRowHeader) ?? typedColumns[0])?.key),
    [typedColumns],
  )

  const rowIds = useMemo(
    () => (items as T[]).map(row => (row as Record<string, unknown>)[rowIdKey] as string | number),
    [items, rowIdKey],
  )

  const rowIdMap = useMemo(
    () => new Map(rowIds.map(id => [String(id), id])),
    [rowIds],
  )

  const getRowId = useCallback(
    (row: T): string | number => (row as Record<string, unknown>)[rowIdKey] as string | number,
    [rowIdKey],
  )

  const normalizeSelectionKeys = useCallback((keys: Set<string | number>) => {
    const normalized = new Set<string | number>()

    for (const key of keys) {
      let normalizedKey = String(key)

      if (typeof key === 'string' && key.endsWith(DETAIL_ROW_SUFFIX) && !rowIdMap.has(key))
        normalizedKey = key.slice(0, -DETAIL_ROW_SUFFIX.length)

      const rowId = rowIdMap.get(normalizedKey)

      if (rowId != null)
        normalized.add(rowId)
    }

    return normalized
  }, [rowIdMap])

  const selectedRowKeys = useMemo<Selection>(() => {
    if (selectedKeys === 'all')
      return 'all'

    return normalizeSelectionKeys(selectedKeys)
  }, [normalizeSelectionKeys, selectedKeys])

  const handleSelectionChange = useCallback((keys: Selection) => {
    if (keys === 'all') {
      setSelectedKeys('all')
      return
    }

    // Ignore detail-row keys (they have no checkbox and are only rendered as
    // collapsed/expanded sub-rows). Including them would cause '2--detail' to
    // map back to row 2, making the selection appear unchanged even after the
    // user unchecks row 2 when coming from 'all'.
    const normalized = new Set<string | number>()

    for (const key of keys) {
      const strKey = String(key)

      if (strKey.endsWith(DETAIL_ROW_SUFFIX) && !rowIdMap.has(strKey))
        continue

      const rowId = rowIdMap.get(strKey)

      if (rowId != null)
        normalized.add(rowId)
    }

    setSelectedKeys(normalized)
  }, [rowIdMap, setSelectedKeys])

  const allColumns = useMemo<ColumnDef<T>[]>(() => [
    ...typedColumns,
    ...(hasActions
      ? [{ key: '__actions__', label: 'Actions', className: 'text-end' } satisfies ColumnDef<T>]
      : []),
  ], [typedColumns, hasActions])

  const detailColSpan = useMemo(
    () => (isExpandable || selectable ? 1 : 0) + allColumns.length,
    [allColumns.length, isExpandable, selectable],
  )

  const handleSortChange = useCallback((d: SortDescriptor) => setSort(d), [setSort])
  const handlePreviousPage = useCallback(() => setPage(Math.max(1, page - 1)), [page, setPage])
  const handleNextPage = useCallback(() => setPage(Math.min(totalPages, page + 1)), [page, setPage, totalPages])

  const renderDefaultDetail = useCallback((row: T) => (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:grid-cols-6">
      {typedColumns.map(col => (
        <div className="flex flex-col gap-0.5" key={col.key}>
          <Label>{col.label || col.key}</Label>
          <span className="truncate text-sm text-muted">
            {col.render
              ? col.render(row)
              : ((row as Record<string, unknown>)[col.key] == null
                  ? '—'
                  : String((row as Record<string, unknown>)[col.key]))}
          </span>
        </div>
      ))}
    </div>
  ), [typedColumns])

  const renderCell = useCallback((col: ColumnDef<T>, row: T, rowId: string | number) => {
    if (col.key === '__actions__') {
      return (
        <div className="flex items-center justify-end gap-1">
          {renderActions?.({ row, rowId })}
          {operations.update && hasFormModal && (
            <Button isIconOnly onPress={() => openEdit(row)} size="sm" variant="tertiary">
              <Pencil size={14} />
            </Button>
          )}
          {operations.update && !hasFormModal && (
            <Button isIconOnly onPress={() => openEdit(row)} size="sm" variant="tertiary">
              <Eye size={14} />
            </Button>
          )}
          {operations.delete && (
            <Button
              isIconOnly
              onPress={() => handleDelete(rowId)}
              size="sm"
              variant="danger-soft"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      )
    }

    if (col.render)
      return col.render(row)

    const value = (row as Record<string, unknown>)[col.key]

    return value == null ? '—' : String(value)
  }, [handleDelete, hasFormModal, openEdit, operations.delete, operations.update, renderActions])

  return (
    <Table variant={variant}>
      <Table.ScrollContainer>
        <Table.Content
          aria-label={ariaLabel}
          className="min-w-150 table-fixed"
          onSelectionChange={selectable ? handleSelectionChange : undefined}
          onSortChange={handleSortChange}
          selectedKeys={selectable ? selectedRowKeys : undefined}
          selectionMode={selectable ? 'multiple' : 'none'}
          sortDescriptor={sort}
        >
          <Table.Header className="sticky top-0 z-10 bg-surface-secondary">
            {(isExpandable || selectable) && (
              <Table.Column
                className="pr-0"
                style={{ width: isExpandable && selectable ? '4.5rem' : '2.5rem' }}
              >
                {selectable
                  ? (
                      <Checkbox aria-label="Select all" className={cn(isExpandable ? 'ml-7' : '')} slot="selection">
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox>
                    )
                  : ''}
              </Table.Column>
            )}
            {allColumns.map(col => (
              <Table.Column
                allowsSorting={col.sortable}
                className={cn(
                  col.className,
                  col.key === '__actions__' && 'sticky right-0 z-20 bg-inherit',
                )}
                id={col.key}
                isRowHeader={col.isRowHeader}
                key={col.key}
                style={
                  col.width != null
                    ? { width: typeof col.width === 'number' ? `${col.width}px` : col.width }
                    : undefined
                }
              >
                {col.sortable
                  ? ({ sortDirection }: { sortDirection?: 'ascending' | 'descending' }) => (
                      <SortableHeader sortDirection={sortDirection}>
                        {col.label}
                      </SortableHeader>
                    )
                  : col.label}
              </Table.Column>
            ))}
          </Table.Header>

          <Table.Body
            renderEmptyState={!loading
              ? () => (
                  <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 py-10 text-center">
                    <PackageOpen className="size-6 text-muted" />
                    <span className="text-sm text-muted">No results found</span>
                  </EmptyState>
                )
              : undefined}
          >
            {isInitialLoading
              ? skeletonRows.map(i => (
                  <Table.Row id={`skeleton-${i}`} key={`skeleton-${i}`}>
                    {(isExpandable || selectable) && (
                      <Table.Cell className="pr-0">
                        {selectable && <SkeletonCell className="size-4 rounded" />}
                      </Table.Cell>
                    )}
                    {allColumns.map(col => (
                      <Table.Cell
                        className={cn(col.key === '__actions__' && 'sticky right-0 z-10 bg-inherit')}
                        key={col.key}
                      >
                        <SkeletonCell />
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              : (items as T[]).flatMap((row) => {
                  const id = getRowId(row)
                  const isExpanded = expandedRowId === id

                  return [
                    <Table.Row id={id} key={id}>
                      {(isExpandable || selectable) && (
                        <Table.Cell className="pr-0">
                          <div className="flex items-center gap-1">
                            {isExpandable && (
                              <Button
                                className="size-6"
                                isIconOnly
                                onPress={() => setExpandedRowId(isExpanded ? null : id)}
                                size="sm"
                                variant="ghost"
                              >
                                <ChevronDown
                                  className={cn(
                                    'size-3 transition-transform duration-200',
                                    isExpanded && 'rotate-180',
                                  )}
                                />
                              </Button>
                            )}
                            {selectable && (
                              <Checkbox aria-label="Select row" slot="selection" variant="secondary">
                                <Checkbox.Control>
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox>
                            )}
                          </div>
                        </Table.Cell>
                      )}
                      {allColumns.map(col => (
                        <Table.Cell
                          className={cn(
                            col.className,
                            'whitespace-nowrap min-w-max truncate',
                            col.key === '__actions__' && 'sticky right-0 z-10 bg-inherit',
                          )}
                          key={col.key}
                        >
                          {renderCell(col, row, id)}
                        </Table.Cell>
                      ))}
                    </Table.Row>,
                    ...(isExpandable
                      ? [
                          <Table.Row
                            className={cn(!isExpanded && 'border-b-0')}
                            id={`${id}${DETAIL_ROW_SUFFIX}`}
                            key={`${id}${DETAIL_ROW_SUFFIX}`}
                          >
                            <Table.Cell
                              className={cn('p-0', isExpanded ? '' : 'border-none')}
                              colSpan={detailColSpan}
                            >
                              <div
                                className={cn(
                                  'grid transition-[grid-template-rows] duration-200 ease-in-out',
                                  isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                                )}
                              >
                                <div className="overflow-hidden">
                                  <Card className="m-3 overflow-hidden rounded-lg border border-foreground/10 shadow-none">
                                    <Card.Content>
                                      {renderDetail ? renderDetail(row) : renderDefaultDetail(row)}
                                    </Card.Content>
                                  </Card>
                                </div>
                              </div>
                            </Table.Cell>
                          </Table.Row>,
                        ]
                      : []),
                  ]
                })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>

      <Table.Footer className="sticky bottom-0 z-10 bg-surface-secondary">
        <Pagination size="sm">
          <Pagination.Summary>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap">Rows per page</span>
                <Select
                  aria-label="Rows per page"
                  className="w-20 [&_.select__trigger]:min-h-7 [&_.select__trigger]:py-0.5 [&_.select__value]:text-xs! [&_.select__value]:sm:text-xs!"
                  onChange={value => value != null && setPageSize(Number(value))}
                  value={pageSize}
                  variant="secondary"
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {PAGE_SIZE_OPTIONS.map(size => (
                        <ListBox.Item id={size} key={size} textValue={String(size)}>
                          {size}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
              <span className="select-none text-muted">·</span>
              {loading ? <Spinner size="sm" /> : <span>{`${start} to ${end} of ${total} results`}</span>}
            </div>
          </Pagination.Summary>
          <Pagination.Content className="select-none">
            <Pagination.Item>
              <Pagination.Previous isDisabled={page === 1} onPress={handlePreviousPage}>
                <Pagination.PreviousIcon />
                Previous
              </Pagination.Previous>
            </Pagination.Item>
            {pageNumbers.map((p, i) =>
              p === 'ellipsis'
                ? (
                    <Pagination.Item key={`ellipsis-${i}`}>
                      <Pagination.Ellipsis />
                    </Pagination.Item>
                  )
                : (
                    <Pagination.Item key={p}>
                      <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                        {p}
                      </Pagination.Link>
                    </Pagination.Item>
                  ),
            )}
            <Pagination.Item>
              <Pagination.Next isDisabled={page === totalPages} onPress={handleNextPage}>
                Next
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </Table.Footer>
    </Table>
  )
}

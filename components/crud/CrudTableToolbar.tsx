'use client'

import { Button, Tooltip } from '@heroui/react'
import { Download, Plus, RefreshCcw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { cn } from '~/lib/utils/tools'
import { useCrudTableCtx } from './context'

interface CrudTableToolbarProps {
  /**
   * Label text rendered inside the create button.
   * Only visible when `operations.create` is defined on the handle.
   *
   * @default "Create"
   *
   * @example
   * <CrudTable.Toolbar createLabel="New User" />
   */
  createLabel?: string

  /**
   * When `true`, an Export button is shown in the toolbar.
   *
   * @default false
   *
   * @example
   * <CrudTable.Toolbar showExport onExport={() => downloadCsv(handle.items)} />
   */
  showExport?: boolean

  /**
   * Called when the Export button is pressed.
   * Use this to trigger a file download, open an export dialog, or call an API.
   *
   * @example
   * <CrudTable.Toolbar showExport onExport={() => exportToCsv(handle.items)} />
   */
  onExport?: () => void
}

/**
 * Toolbar sub-component for `CrudTable`.
 * Renders the create button, batch-delete button, refresh button, and the Filters toggle.
 * All visibility and action state are sourced from `CrudTableContext` — no props required
 * beyond an optional create button label.
 *
 * Visibility rules:
 * - **Create**: shown when `operations.create` is defined on the handle.
 * - **Delete Selected**: shown when rows are selected and `operations.batchDelete` is defined.
 * - **Filters toggle**: shown only when `CrudTable.FilterPanel` is also mounted in the tree.
 * - **Refresh**: always shown; spins while a list request is in-flight.
 *
 * @example
 * // Default label
 * <CrudTable.Toolbar />
 *
 * @example
 * // Custom create label
 * <CrudTable.Toolbar createLabel="New User" />
 *
 * @example
 * // With export button
 * <CrudTable.Toolbar showExport onExport={() => exportToCsv(handle.items)} />
 */
export function CrudTableToolbar({ createLabel = 'Create', showExport = false, onExport }: CrudTableToolbarProps) {
  const { handle, filterPanelOpen, setFilterPanelOpen, hasFilterPanel } = useCrudTableCtx()
  const { selectedKeys, operations, openCreate, handleBatchDelete, loading, refresh, filters } = handle

  const filterCount = useMemo(() => (
    Object.values(filters)
      .filter(v => v !== '' && v !== null && v !== undefined)
      .length
  ), [filters])

  const hasBatchSelection = selectedKeys === 'all' || (selectedKeys instanceof Set && selectedKeys.size > 0)

  const handleToggle = useCallback(() => {
    setFilterPanelOpen(prev => !prev)
  }, [setFilterPanelOpen])

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pb-3">
      {hasBatchSelection && operations.batchDelete && (
        <Button onPress={handleBatchDelete} size="sm" variant="danger-soft">
          <Trash2 className="size-4" />
          Delete Selected
        </Button>
      )}

      {hasFilterPanel && (
        <Tooltip delay={0}>
          <Button
            onPress={handleToggle}
            size="sm"
            variant={filterPanelOpen ? 'secondary' : 'tertiary'}
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {filterCount > 0 && (
              <span
                className={cn(
                  'flex size-4 items-center justify-center rounded-full text-[10px] font-semibold',
                  filterPanelOpen ? 'bg-foreground text-background' : 'bg-accent text-accent-foreground',
                )}
              >
                {filterCount}
              </span>
            )}
          </Button>
          <Tooltip.Content>
            <p>{filterPanelOpen ? 'Close filters' : 'Open filters'}</p>
          </Tooltip.Content>
        </Tooltip>
      )}

      <Tooltip delay={0}>
        <Button isIconOnly onPress={refresh} size="sm" variant={loading ? 'secondary' : 'tertiary'}>
          <RefreshCcw className={cn('size-4', loading && 'animate-spin')} />
        </Button>
        <Tooltip.Content>
          <p>Refresh the list</p>
        </Tooltip.Content>
      </Tooltip>

      {operations.create && (
        <Button onPress={openCreate} size="sm" variant="primary">
          <Plus className="size-4" />
          {createLabel}
        </Button>
      )}

      {showExport && (
        <Tooltip delay={0}>
          <Button onPress={onExport} size="sm" variant="primary">
            <Download className="size-4" />
            Export
          </Button>
          <Tooltip.Content>
            <p>Export</p>
          </Tooltip.Content>
        </Tooltip>
      )}
    </div>
  )
}

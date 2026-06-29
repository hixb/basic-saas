'use client'

import type { ReactNode } from 'react'
import { Button } from '@heroui/react'
import { Check, X } from 'lucide-react'

interface FilterPanelProps {
  /**
   * Filter input controls rendered in the main body of the panel,
   * between the "Filter Options" header and the action buttons.
   * Typically a set of `<Select>`, `<Input>`, or `<DatePicker>` elements.
   *
   * @example
   * <FilterPanel onApply={apply} onClear={clear}>
   *   <Select placeholder="Status" onChange={v => setField('status', v)}>...</Select>
   *   <Select placeholder="Plan" onChange={v => setField('plan', v)}>...</Select>
   * </FilterPanel>
   */
  children: ReactNode

  /**
   * Called when the user presses the "Clear all" button.
   * Should reset all pending filter values to their empty/default state.
   *
   * @example
   * const { clear } = usePendingFilters(handle.setFilters)
   * <FilterPanel onClear={clear} onApply={apply}>...</FilterPanel>
   */
  onClear: () => void

  /**
   * Called when the user presses the "Apply Filters" button.
   * Should commit pending filter values to the CRUD handle via `handle.setFilters`.
   *
   * @example
   * const { apply } = usePendingFilters(handle.setFilters)
   * <FilterPanel onClear={clear} onApply={apply}>...</FilterPanel>
   */
  onApply: () => void
}

/**
 * Standalone filter panel shell for use inside `CrudTable.FilterPanel`.
 * Renders a "Filter Options" section header, a grid of filter input controls,
 * and a right-aligned footer with "Clear all" and "Apply Filters" buttons.
 *
 * Intended to be paired with `usePendingFilters` so that filter inputs update
 * a local pending state that is only committed to the CRUD handle on "Apply".
 *
 * @example
 * const { pending, setField, apply, clear } = usePendingFilters(handle.setFilters)
 *
 * <CrudTable.FilterPanel>
 *   <FilterPanel onApply={apply} onClear={clear}>
 *     <Select
 *       placeholder="Status"
 *       value={pending.status ?? ''}
 *       onChange={v => setField('status', v)}
 *     >
 *       ...
 *     </Select>
 *   </FilterPanel>
 * </CrudTable.FilterPanel>
 */
export function FilterPanel({ children, onClear, onApply }: FilterPanelProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Filter Options
        </p>
      </div>

      <div className="gap-4 grid grid-cols-5">
        {children}
      </div>

      <div className="flex justify-end gap-2">
        <Button onPress={onClear} size="sm" variant="danger-soft">
          <X className="size-3.5" />
          Clear all
        </Button>
        <Button onPress={onApply} size="sm" variant="primary">
          <Check className="size-3.5" />
          Apply Filters
        </Button>
      </div>
    </div>
  )
}

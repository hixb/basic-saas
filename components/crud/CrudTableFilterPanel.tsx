'use client'

import type { JSX, ReactNode } from 'react'
import { useEffect } from 'react'
import { cn } from '~/lib/utils/tools'
import { useCrudTableCtx } from './context'
import { FilterPanel } from './FilterPanel'

interface CrudTableFilterPanelProps {
  /**
   * Filter controls to render inside the collapsible panel.
   * Typically a `<FilterPanel>` shell containing form inputs such as
   * `<Select>`, `<Input>`, or `<DatePicker>`.
   *
   * The panel's open/closed state is managed automatically via context —
   * mounting this component also causes `CrudTable.Toolbar` to render
   * its Filters toggle button.
   *
   * @example
   * <CrudTable.FilterPanel>
   *   <FilterPanel onApply={apply} onClear={clear}>
   *     <Select placeholder="Status" onChange={v => setField('status', v)}>
   *       ...
   *     </Select>
   *   </FilterPanel>
   * </CrudTable.FilterPanel>
   */
  children: ReactNode
}

/**
 * Collapsible filter panel sub-component for `CrudTable`.
 * Registers itself in context on mount, which causes `CrudTable.Toolbar` to automatically
 * render its Filters toggle button. The panel's expand/collapse animation is driven by
 * `filterPanelOpen` from `CrudTableContext`.
 *
 * Use `CrudTable.FilterPanel.Content` inside to render the "Filter Options" header,
 * filter input grid, and Apply/Clear action buttons.
 *
 * @example
 * <CrudTable.FilterPanel>
 *   <CrudTable.FilterPanel.Content onApply={apply} onClear={clear}>
 *     <Select placeholder="Status" onChange={v => setField('status', v)}>
 *       ...
 *     </Select>
 *   </CrudTable.FilterPanel.Content>
 * </CrudTable.FilterPanel>
 */
function CrudTableFilterPanelRoot({ children }: CrudTableFilterPanelProps): JSX.Element {
  const { filterPanelOpen, registerFilterPanel } = useCrudTableCtx()

  useEffect(() => registerFilterPanel(), [registerFilterPanel])

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-200 ease-in-out',
        filterPanelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
    >
      <div className="overflow-hidden">
        <div className="mb-3 rounded-[calc(var(--radius)*2.5)] border border-foreground/10 bg-surface-secondary p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

CrudTableFilterPanelRoot.Content = FilterPanel

/**
 * @see CrudTableFilterPanelRoot
 */
export const CrudTableFilterPanel: ((props: CrudTableFilterPanelProps) => JSX.Element) & {
  /**
   * Inner content shell for `CrudTable.FilterPanel`.
   * Renders the "Filter Options" section header, a grid of filter input controls,
   * and a right-aligned footer with "Clear all" and "Apply Filters" buttons.
   *
   * @example
   * <CrudTable.FilterPanel>
   *   <CrudTable.FilterPanel.Content onApply={apply} onClear={clear}>
   *     <Select placeholder="Status" onChange={v => setField('status', v)}>...</Select>
   *   </CrudTable.FilterPanel.Content>
   * </CrudTable.FilterPanel>
   */
  Content: typeof FilterPanel
} = CrudTableFilterPanelRoot as any

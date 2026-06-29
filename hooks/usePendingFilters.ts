'use client'

import { useState } from 'react'

/**
 * Manages a local "pending" copy of filter values that are only committed
 * to the table's active filters when the user explicitly presses Apply.
 *
 * @param setFilters     - The `setFilters` action from `useCrudTable`'s handle.
 * @param setKeyword     - The `setKeyword` action from `useCrudTable`'s handle.
 *                         When provided, `clear()` also resets the keyword search
 *                         and removes it from the URL.
 * @param initialFilters - Initial filter values used to pre-populate the pending
 *                         state. Pass `handle.filters` when `syncUrl` is enabled
 *                         so that filter inputs are restored from URL params on
 *                         page refresh.
 *
 * @example
 * const { pending, setField, apply, clear } = usePendingFilters(
 *   handle.setFilters,
 *   handle.setKeyword,
 *   handle.filters,
 * )
 *
 * <Select value={pending.status} onChange={v => setField('status', v)} />
 * <Button onPress={apply}>Apply</Button>
 * <Button onPress={clear}>Clear all</Button>
 */
export function usePendingFilters(
  setFilters: (filters: Record<string, unknown>) => void,
  setKeyword?: (keyword: string) => void,
  initialFilters?: Record<string, unknown>,
) {
  const [pending, setPending] = useState<Record<string, string>>(() =>
    initialFilters
      ? Object.fromEntries(Object.entries(initialFilters).map(([k, v]) => [k, String(v)]))
      : {},
  )

  function setField(key: string, value: string) {
    setPending(prev => ({ ...prev, [key]: value }))
  }

  function apply() {
    const active: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(pending)) {
      if (v && v !== 'all')
        active[k] = v
    }
    setFilters(active)
  }

  function clear() {
    setPending({})
    setFilters({})
    setKeyword?.('')
  }

  return { pending, setField, apply, clear }
}

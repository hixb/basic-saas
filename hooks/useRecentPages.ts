'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'

const STORAGE_KEY = 'admin_recent_pages'
const MAX_PAGES = 12

export interface RecentPage {
  href: string
  label: string
  pinned: boolean
}

type Action
  = { type: 'INIT', pages: RecentPage[] }
    | { type: 'ADD_PAGE', href: string, label: string }
    | { type: 'TOGGLE_PIN', href: string }
    | { type: 'REMOVE', href: string }

function reducer(state: RecentPage[], action: Action): RecentPage[] {
  switch (action.type) {
    case 'INIT':
      return action.pages
    case 'ADD_PAGE': {
      const existing = state.find(p => p.href === action.href)

      // Already pinned — preserve position and pinned status unchanged
      if (existing?.pinned)
        return state

      const filtered = state.filter(p => p.href !== action.href)
      const pinned = filtered.filter(p => p.pinned)
      const recent = [
        { href: action.href, label: action.label, pinned: false },
        ...filtered.filter(p => !p.pinned),
      ]

      return [...pinned, ...recent].slice(0, MAX_PAGES)
    }
    case 'TOGGLE_PIN': {
      const page = state.find(p => p.href === action.href)

      if (!page)
        return state

      const updated = { ...page, pinned: !page.pinned }
      const filtered = state.filter(p => p.href !== action.href)
      const pinned = filtered.filter(p => p.pinned)
      const recent = filtered.filter(p => !p.pinned)

      // Newly pinned → end of pinned section; newly unpinned → front of recent
      return updated.pinned
        ? [...pinned, updated, ...recent]
        : [...pinned, updated, ...recent]
    }
    case 'REMOVE': {
      return state.filter(p => p.href !== action.href)
    }
    default:
      return state
  }
}

export interface UseRecentPagesReturn {
  pages: RecentPage[]
  togglePin: (href: string) => void
  remove: (href: string) => void
}

export function useRecentPages(currentHref: string, currentLabel?: string): UseRecentPagesReturn {
  const [pages, dispatch] = useReducer(reducer, [])

  const saveRunCountRef = useRef(0)

  // Load persisted pages from localStorage after mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as RecentPage[]
      if (saved.length > 0)
        dispatch({ type: 'INIT', pages: saved })
    }
    catch {
      // ignore parse errors
    }
  }, [])

  useEffect(() => {
    const label = currentLabel?.trim()

    if (!label)
      return

    dispatch({ type: 'ADD_PAGE', href: currentHref, label })
  }, [currentHref, currentLabel])

  useEffect(() => {
    saveRunCountRef.current++

    if (saveRunCountRef.current <= 1)
      return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
    }
    catch {
      // ignore storage errors
    }
  }, [pages])

  const togglePin = useCallback((href: string) => dispatch({ type: 'TOGGLE_PIN', href }), [])
  const remove = useCallback((href: string) => dispatch({ type: 'REMOVE', href }), [])

  return { pages, togglePin, remove }
}

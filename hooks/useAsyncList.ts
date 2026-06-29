'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'

type LoadingState = 'idle' | 'loading' | 'loadingMore' | 'error'

interface AsyncListOptions<T> {
  load: (context: { cursor?: string, signal: AbortSignal }) => Promise<{
    items: T[]
    cursor?: string
  }>
}

interface AsyncListState<T> {
  state: LoadingState
  items: T[]
  error?: Error
  abortController?: AbortController
  cursor?: string
}

type Action<T>
  = | { type: 'loading', abortController: AbortController }
    | { type: 'loadingMore', abortController: AbortController }
    | { type: 'success', items: T[], cursor?: string, abortController: AbortController }
    | { type: 'error', error: Error, abortController: AbortController }

function reducer<T>(state: AsyncListState<T>, action: Action<T>): AsyncListState<T> {
  switch (state.state) {
    case 'idle':
    case 'error':
      switch (action.type) {
        case 'loading':
        case 'loadingMore':
          return {
            ...state,
            state: action.type,
            items: action.type === 'loading' ? [] : state.items,
            abortController: action.abortController,
          }
        default:
          return state
      }

    case 'loading':
    case 'loadingMore':
      switch (action.type) {
        case 'success':
          if (action.abortController !== state.abortController) {
            return state
          }

          return {
            ...state,
            state: 'idle',
            items: state.state === 'loadingMore'
              ? [...state.items, ...action.items]
              : action.items,
            cursor: action.cursor,
            abortController: undefined,
          }

        case 'error':
          if (action.abortController !== state.abortController) {
            return state
          }

          return {
            ...state,
            state: 'error',
            error: action.error,
            abortController: undefined,
          }

        case 'loading':
        case 'loadingMore':
          state.abortController?.abort()
          return {
            ...state,
            state: action.type,
            items: action.type === 'loading' ? [] : state.items,
            abortController: action.abortController,
          }

        default:
          return state
      }

    default:
      return state
  }
}

const initialState = {
  state: 'idle' as LoadingState,
  items: [],
  cursor: undefined,
}

export function useAsyncList<T>({ load }: AsyncListOptions<T>) {
  const [state, dispatch] = useReducer(reducer<T>, initialState)
  const didInitialLoad = useRef(false)

  const loadRef = useRef(load)

  useEffect(() => {
    loadRef.current = load
  }, [load])

  useEffect(() => {
    if (didInitialLoad.current)
      return
    didInitialLoad.current = true

    const abortController = new AbortController()
    dispatch({ type: 'loading', abortController })

    loadRef.current({ signal: abortController.signal })
      .then((result) => {
        dispatch({
          type: 'success',
          items: result.items,
          cursor: result.cursor,
          abortController,
        })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          dispatch({ type: 'error', error, abortController })
        }
      })

    return () => abortController.abort()
  }, [])

  const loadMore = useCallback(() => {
    if (state.state === 'loading' || state.state === 'loadingMore' || state.cursor == null) {
      return
    }

    const abortController = new AbortController()
    dispatch({ type: 'loadingMore', abortController })

    loadRef.current({ cursor: state.cursor, signal: abortController.signal })
      .then((result) => {
        dispatch({
          type: 'success',
          items: result.items,
          cursor: result.cursor,
          abortController,
        })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          dispatch({ type: 'error', error, abortController })
        }
      })
  }, [state.state, state.cursor])

  return {
    items: state.items,
    loadingState: state.state,
    error: state.error,
    loadMore,
  }
}

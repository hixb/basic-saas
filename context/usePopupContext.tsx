'use client'

import type { ComponentType, ReactNode } from 'react'
import type { ActionDialogOptions } from '~/components/global/ActionDialog'
import type { ImageViewerProps } from '~/components/global/ImageViewer'
import type { LoginPopLayerProps } from '~/components/global/LoginPopLayer'
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'

export type PopupType = 'LoginPopLayer' | 'ImageViewer' | 'ActionDialog'

interface PopupParamRequired {
  LoginPopLayer: false
  ImageViewer: false
  ActionDialog: false
}

interface PopupCallbacks {
  onOpen?: () => void | Promise<void>
  onClose?: () => void | Promise<void>
  beforeOpen?: () => void | Promise<void>
  beforeClose?: () => void | Promise<void>
}

class PopupBuilder<T extends PopupType> {
  private readonly type: T
  private readonly params: PopupParamsMap[T]
  private readonly callbacks: PopupCallbacks = {}
  private readonly shouldShow: boolean
  private executed = false

  constructor(type: T, params: PopupParamsMap[T], shouldShow: boolean) {
    this.type = type
    this.params = params
    this.shouldShow = shouldShow

    queueMicrotask(() => {
      if (!this.executed) {
        this.execute()
      }
    })
  }

  open(callback: () => void | Promise<void>): this {
    this.callbacks.onOpen = callback
    return this
  }

  close(callback: () => void | Promise<void>): this {
    this.callbacks.onClose = callback
    return this
  }

  beforeOpen(callback: () => void | Promise<void>): this {
    this.callbacks.beforeOpen = callback
    return this
  }

  beforeClose(callback: () => void | Promise<void>): this {
    this.callbacks.beforeClose = callback
    return this
  }

  private async execute() {
    this.executed = true
    if (this.shouldShow) {
      await this.callbacks.beforeOpen?.()
      window.__popupManager?.showPopup(this.type, this.params, this.callbacks)
    }
    else {
      await this.callbacks.beforeClose?.()
      window.__popupManager?.hidePopup(this.type, this.callbacks)
    }
  }
}

type PopupControllers = {
  [T in PopupType]: {
    visible: PopupParamRequired[T] extends true
      ? (params: PopupParamsMap[T]) => PopupBuilder<T>
      : (params?: PopupParamsMap[T]) => PopupBuilder<T>
    invisible: () => PopupBuilder<T>
  }
}

interface PopupParamsMap {
  LoginPopLayer: LoginPopLayerProps
  ImageViewer: ImageViewerProps
  ActionDialog: ActionDialogOptions
}

interface PopupComponentProps {
  LoginPopLayer: LoginPopLayerProps
  ImageViewer: ImageViewerProps
  ActionDialog: ActionDialogOptions
}

interface PopupState<T extends PopupType> {
  visible: boolean
  params: PopupParamsMap[T]
  shouldLoad: boolean
  isClosing: boolean
  callbacks: PopupCallbacks
}

interface PopupContextType {
  popups: {
    [T in PopupType]: PopupState<T>
  }
  showPopup: <T extends PopupType>(type: T, params: PopupParamsMap[T], callbacks?: PopupCallbacks) => void
  hidePopup: (type: PopupType, callbacks?: PopupCallbacks) => void
  registeredComponents: Map<PopupType, ComponentType<PopupComponentProps[PopupType]>>
  registerPopup: <T extends PopupType>(type: T, component: ComponentType<PopupComponentProps[T]>) => void
}

const UsePopupContext = createContext<PopupContextType | null>(null)

export function PopupProvider({ children }: { children: ReactNode }) {
  const [popups, setPopups] = useState<{ [T in PopupType]: PopupState<T> }>(({
    LoginPopLayer: { visible: false, params: {} as LoginPopLayerProps, shouldLoad: false, isClosing: false, callbacks: {} },
    ImageViewer: { visible: false, params: {} as ImageViewerProps, shouldLoad: false, isClosing: false, callbacks: {} },
    ActionDialog: { visible: false, params: {} as ActionDialogOptions, shouldLoad: false, isClosing: false, callbacks: {} },
  }) as { [T in PopupType]: PopupState<T> })

  const [registeredComponents, setRegisteredComponents] = useState<Map<PopupType, ComponentType<PopupComponentProps[PopupType]>>>(new Map())

  const registerPopup = useCallback(<T extends PopupType>(type: T, component: ComponentType<PopupComponentProps[T]>) => {
    setRegisteredComponents((prev) => {
      const newMap = new Map(prev)
      newMap.set(type, component as ComponentType<PopupComponentProps[PopupType]>)

      return newMap
    })
  }, [])

  const showPopup = useCallback(<T extends PopupType>(type: T, params: PopupParamsMap[T], callbacks: PopupCallbacks = {}) => {
    setPopups(prev => ({
      ...prev,
      [type]: { visible: true, params, shouldLoad: true, isClosing: false, callbacks },
    }))

    Promise.resolve(callbacks.onOpen?.()).catch(console.error)
  }, [])

  const hidePopup = useCallback((type: PopupType, callbacks: PopupCallbacks = {}) => {
    setPopups(prev => ({
      ...prev,
      [type]: { ...prev[type], visible: false, isClosing: true, callbacks: { ...prev[type].callbacks, ...callbacks } },
    }))

    Promise.resolve(callbacks.onClose?.()).catch(console.error)

    setTimeout(() => {
      setPopups(prev => ({
        ...prev,
        [type]: { ...prev[type], shouldLoad: false, isClosing: false },
      }))
    }, 500)
  }, [])

  const contextValue = useMemo(() => ({
    popups,
    showPopup,
    hidePopup,
    registeredComponents,
    registerPopup,
  }), [popups, showPopup, hidePopup, registeredComponents, registerPopup])

  useEffect(() => {
    window.__popupManager = {
      showPopup,
      hidePopup,
    }

    return () => {
      window.__popupManager = null
    }
  }, [showPopup, hidePopup])

  return (
    <UsePopupContext.Provider value={contextValue}>
      {children}
    </UsePopupContext.Provider>
  )
}

export function usePopup() {
  const context = use(UsePopupContext)
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider')
  }
  return context
}

export function useInitPopupManager() {
  const { showPopup, hidePopup } = usePopup()

  useEffect(() => {
    window.__popupManager = {
      showPopup,
      hidePopup,
    }

    return () => {
      window.__popupManager = null
    }
  }, [showPopup, hidePopup])
}

export const Popup: PopupControllers = {
  LoginPopLayer: {
    visible: (params: LoginPopLayerProps = {}) => {
      return new PopupBuilder('LoginPopLayer', params, true)
    },
    invisible: () => {
      return new PopupBuilder('LoginPopLayer', {} as LoginPopLayerProps, false)
    },
  },
  ImageViewer: {
    visible: (params: ImageViewerProps = {}) => {
      return new PopupBuilder('ImageViewer', params, true)
    },
    invisible: () => {
      return new PopupBuilder('ImageViewer', {} as ImageViewerProps, false)
    },
  },
  ActionDialog: {
    visible: (params: ActionDialogOptions = {}) => {
      return new PopupBuilder('ActionDialog', params, true)
    },
    invisible: () => {
      return new PopupBuilder('ActionDialog', {} as ActionDialogOptions, false)
    },
  },
}

declare global {
  interface Window {
    __popupManager?: {
      showPopup: <T extends PopupType>(type: T, params: PopupParamsMap[T], callbacks?: PopupCallbacks) => void
      hidePopup: (type: PopupType, callbacks?: PopupCallbacks) => void
    } | null
  }
}

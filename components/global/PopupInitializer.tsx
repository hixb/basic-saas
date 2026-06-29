'use client'

import { useEffect } from 'react'
import { ActionDialog } from '~/components/global/ActionDialog'
import { ImageViewer } from '~/components/global/ImageViewer'
import { LoginPopLayer } from '~/components/global/LoginPopLayer'
import { useInitPopupManager, usePopup } from '~/context/usePopupContext'

/**
 * Popup initialization component
 *
 * Used for initializing the global popup manager and registering popup components
 */
export function PopupInitializer() {
  useInitPopupManager()
  const { registerPopup } = usePopup()

  useEffect(() => {
    registerPopup('LoginPopLayer', LoginPopLayer)
    registerPopup('ImageViewer', ImageViewer)
    registerPopup('ActionDialog', ActionDialog)
  }, [registerPopup])

  return null
}

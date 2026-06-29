'use client'

import type { PopupType } from '~/context/usePopupContext'
import { usePopup } from '~/context/usePopupContext'

/**
 * 弹窗懒加载渲染器
 * 根据注册表和加载状态按需渲染弹窗组件
 */
export function LazyPopupRenderer() {
  const { popups, registeredComponents } = usePopup()

  // 将注册的组件转换为数组以便渲染
  const renderableComponents = Array.from(registeredComponents.entries())
    .map(([type, Component]) => {
      const popupType = type as PopupType
      const popup = popups[popupType]

      // 只有当shouldLoad为true或isClosing为true时才渲染组件
      // 这确保了关闭动画能够完成
      if (!popup.shouldLoad && !popup.isClosing) {
        return null
      }

      // 渲染组件，传递必要的props
      return <Component key={type} />
    })
    .filter(Boolean)

  return <>{renderableComponents}</>
}

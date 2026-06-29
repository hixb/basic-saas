'use client'

import type { ForwardRefExoticComponent, ReactNode, RefAttributes, SVGProps } from 'react'
import type { IconNode, IconProps } from 'vectify'
import { createElement, forwardRef } from 'react'

export interface CreateIconProps extends IconProps, Omit<SVGProps<SVGSVGElement>, keyof IconProps> {
  'size'?: number | string
  'color'?: string
  'strokeWidth'?: number | string
  'className'?: string
  'title'?: string
  'aria-label'?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

export function createIcon(name: string, iconNode: IconNode[], keepColors = false): ForwardRefExoticComponent<CreateIconProps & RefAttributes<SVGSVGElement>> {
  const Icon = forwardRef<SVGSVGElement, CreateIconProps>(({
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    className,
    title,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    ...props
  }, ref) => {
    // Determine if icon should be hidden from screen readers
    const shouldHide = ariaHidden !== undefined ? ariaHidden : (!title && !ariaLabel)

    const { className: propsClassName, ...restProps } = props as any
    const allClassNames = [className, propsClassName].filter(Boolean).join(' ')
    const mergedClassName = allClassNames ? `vectify-icon ${allClassNames}` : 'vectify-icon'

    return (
      <svg
        aria-hidden={shouldHide}
        aria-label={ariaLabel}
        height={size}
        ref={ref}
        role={title || ariaLabel ? 'img' : undefined}
        viewBox="0 0 24 24"
        width={size}
        {...restProps}
        className={mergedClassName}
      >
        {title && <title>{title}</title>}
        {renderIconNode(iconNode, keepColors, color, strokeWidth)}
      </svg>
    )
  })

  Icon.displayName = name
  return Icon
}

function renderIconNode(
  nodes: IconNode[],
  keepColors: boolean,
  color: string,
  strokeWidth: number | string,
): ReactNode {
  return nodes.map((node, index) => {
    const [type, attrs, children] = node

    let cleanedAttrs: Record<string, any>

    if (keepColors) {
      cleanedAttrs = attrs
    }
    else {
      // Track color attributes to determine icon type
      let hasFill = false
      let hasStroke = false
      let originalStrokeWidth: number | string | undefined

      Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'fill' && value !== 'none') {
          hasFill = true
        }
        if (key === 'stroke') {
          hasStroke = true
        }
        if (key === 'strokeWidth' || key === 'stroke-width') {
          originalStrokeWidth = value
        }
      })

      // Keep non-color attributes
      cleanedAttrs = Object.fromEntries(
        Object.entries(attrs).filter(([key]) =>
          !['stroke', 'fill', 'strokeWidth', 'stroke-width'].includes(key),
        ),
      )

      // Apply color based on original attributes
      if (hasFill) {
        cleanedAttrs.fill = color
      }
      else if (hasStroke) {
        cleanedAttrs.fill = 'none'
        cleanedAttrs.stroke = color
        cleanedAttrs.strokeWidth = originalStrokeWidth ?? strokeWidth
        cleanedAttrs.strokeLinecap = 'round'
        cleanedAttrs.strokeLinejoin = 'round'
      }
    }

    const props = { key: index, ...cleanedAttrs }

    if (children && children.length > 0) {
      return createElement(
        type,
        props,
        renderIconNode(children, keepColors, color, strokeWidth),
      )
    }

    return createElement(type, props)
  })
}

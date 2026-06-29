'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M11.632 3a8.418 8.418 0 1 1-.001 16.835A8.418 8.418 0 0 1 11.63 3', clipRule: 'evenodd' }],
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M17.361 17.584 20.785 21M9.4 11.418h4.423' }],
]

const ZoomOut = createIcon('ZoomOut', iconNode, false)
export default ZoomOut

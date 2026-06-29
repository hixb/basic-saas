'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M16.924 16.024a7.08 7.08 0 0 1-5.84 3.061A7.08 7.08 0 0 1 4 12.002a7.087 7.087 0 0 1 7.084-7.084 7.094 7.094 0 0 1 7.092 6.898' }],
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M20 8.098 18.392 11.9l-3.783-1.6' }],
]

const RefreshRight = createIcon('RefreshRight', iconNode, false)
export default RefreshRight

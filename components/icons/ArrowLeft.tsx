'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M15.5 19s-7-4.144-7-7 7-7 7-7' }],
]

const ArrowLeft = createIcon('ArrowLeft', iconNode, false)
export default ArrowLeft

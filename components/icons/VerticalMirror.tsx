'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M7.518 11.464 4.122 8.74a.688.688 0 0 0-1.118.537v5.447c0 .576.667.898 1.118.537l3.396-2.724a.688.688 0 0 0 0-1.073', clipRule: 'evenodd' }],
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M12.002 8.333v2m0 3.334v2m0 3.333v2m0-18v2' }],
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'm16.482 12.537 3.396 2.724a.688.688 0 0 0 1.118-.537V9.277a.688.688 0 0 0-1.118-.537l-3.396 2.724a.688.688 0 0 0 0 1.073', clipRule: 'evenodd' }],
]

const VerticalMirror = createIcon('VerticalMirror', iconNode, false)
export default VerticalMirror

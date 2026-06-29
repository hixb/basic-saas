'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M11.464 16.482 8.74 19.878a.688.688 0 0 0 .537 1.118h5.447a.688.688 0 0 0 .537-1.118l-2.724-3.396a.687.687 0 0 0-1.073 0M12.537 7.518l2.724-3.396a.688.688 0 0 0-.537-1.118H9.277a.688.688 0 0 0-.537 1.118l2.724 3.396a.687.687 0 0 0 1.073 0', clipRule: 'evenodd' }],
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M8.334 11.998h2m3.333 0h2m3.333 0h2m-18 0h2' }],
]

const HorizontalMirror = createIcon('HorizontalMirror', iconNode, false)
export default HorizontalMirror

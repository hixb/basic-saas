'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M6.007 3.22h11.987A3.007 3.007 0 0 1 21 6.228v7.5a3.007 3.007 0 0 1-3.006 3.008H6.007A3.01 3.01 0 0 1 3 13.728v-7.5A3.007 3.007 0 0 1 6.007 3.22' }],
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'm14.097 16.734 1.606 2.818a.845.845 0 0 1-.735 1.257H9.036a.844.844 0 0 1-.737-1.266l1.625-2.809M3 12.676h18' }],
]

const Imac = createIcon('Imac', iconNode, false)
export default Imac

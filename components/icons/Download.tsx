'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M3 15v.08c0 2.072 0 3.108.403 3.9a3.7 3.7 0 0 0 1.617 1.617C5.812 21 6.848 21 8.92 21h6.16c2.072 0 3.108 0 3.9-.403a3.7 3.7 0 0 0 1.617-1.617c.403-.792.403-1.828.403-3.9V15M7.781 11.207 12 15.55m0 0 4.218-4.344M12 15.55V3' }],
]

const Download = createIcon('Download', iconNode, false)
export default Download

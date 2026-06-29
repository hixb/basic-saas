'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { fill: '#FFF', fillRule: 'evenodd', d: 'M11.632 3.75a7.668 7.668 0 1 0 .001 15.335 7.668 7.668 0 0 0 0-15.335m6.787 13.83a9.14 9.14 0 0 0 2.38-6.163 9.167 9.167 0 0 0-9.167-9.167 9.167 9.167 0 0 0-9.167 9.167 9.168 9.168 0 0 0 14.858 7.188l2.932 2.926a.75.75 0 1 0 1.06-1.062zm-6.787-9.15a.75.75 0 0 1 .75.75v1.487h1.487a.75.75 0 0 1 0 1.5h-1.487v1.487a.75.75 0 0 1-1.5 0v-1.487H9.395a.75.75 0 0 1 0-1.5h1.487V9.181a.75.75 0 0 1 .75-.75', clipRule: 'evenodd' }],
]

const ZommIn = createIcon('ZommIn', iconNode, false)
export default ZommIn

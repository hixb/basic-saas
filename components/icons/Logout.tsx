'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M9 21h-.08c-2.072 0-3.108 0-3.9-.403a3.7 3.7 0 0 1-1.617-1.617C3 18.188 3 17.152 3 15.08V8.92c0-2.072 0-3.108.403-3.9A3.7 3.7 0 0 1 5.02 3.403C5.812 3 6.848 3 8.92 3H9M16.656 16.218 21 12m0 0L16.656 7.78M21 12H8.45' }],
]

const Logout = createIcon('Logout', iconNode, false)
export default Logout

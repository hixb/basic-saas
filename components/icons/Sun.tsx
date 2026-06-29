'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M12 3v1.372m0 15.256V21m9-9h-1.372M4.372 12H3m15.364-6.364-.97.97M6.606 17.394l-.97.97m12.728 0-.97-.97M6.606 6.606l-.97-.97' }],
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M12 7.805a4.195 4.195 0 1 1 0 8.39 4.195 4.195 0 0 1 0-8.39', clipRule: 'evenodd' }],
]

const Sun = createIcon('Sun', iconNode, false)
export default Sun

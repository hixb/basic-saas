'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeWidth: 1.5, d: 'M12 10.2v.01M17.4 15.6c2.186-.82 3.6-2.128 3.6-3.6 0-2.015-2.648-3.72-6.3-4.294M12 16.5c-4.97 0-9-2.015-9-4.5 0-2.015 2.649-3.72 6.3-4.294' }],
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeWidth: 1.5, d: 'm9.3 13.8 2.699 2.699q0 0 0 0v.001q0 0 0 0l-2.7 2.7M12 4.8v.01M12 7.5v.01' }],
]

const SpinRight = createIcon('SpinRight', iconNode, false)
export default SpinRight

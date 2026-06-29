'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { fill: '#FFF', d: 'M12.183 21.742c-5.47 0-9.93-4.45-9.93-9.93 0-4.41 2.96-8.33 7.19-9.54.29-.08.66.04.85.27.2.25.24.6.08.89-1.53 2.89-.99 6.53 1.34 8.85 2.32 2.32 5.96 2.87 8.85 1.33.27-.14.66-.1.89.09s.35.56.27.85c-1.21 4.24-5.14 7.2-9.54 7.2zm-3.77-17.46c-2.8 1.41-4.66 4.32-4.66 7.54 0 4.65 3.78 8.43 8.43 8.43 3.22 0 6.13-1.86 7.54-4.67-3.14.97-6.68.15-9.06-2.24-2.38-2.38-3.21-5.92-2.24-9.06z' }],
]

const Moon = createIcon('Moon', iconNode, false)
export default Moon

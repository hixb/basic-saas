'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M16.514 3.084v1.94M8.985 3.084v1.94M12.75 20.916H8.44c-2.533 0-4.115-1.443-4.115-4.078V9.031c0-2.594 1.582-4.005 4.116-4.005h8.626c2.541 0 4.115 1.41 4.108 4.004v7.873c0 2.594-1.574 4.013-4.116 4.013h-1.056' }],
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'm12.778 15.65 1.663-5.355h-3.378' }],
]

const Calendar = createIcon('Calendar', iconNode, false)
export default Calendar

'use client'

import type { IconNode } from 'vectify'
import { createIcon } from './createIcon'

export const iconNode: IconNode[] = [
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M21 12a9 9 0 0 0-9-9 9 9 0 1 0 9 9M12 3v2.25m-6.363.387 1.59 1.59m11.137 11.138-1.75-1.75m-10.977 1.75 1.75-1.75M18.364 5.637l-1.59 1.59M3 12h2.475m15.526 0H18.75' }],
  ['path', { stroke: '#FFF', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5, d: 'M12 14.887c-1.788 0-2.244-1.728-2.048-2.606.197-.879 1.094-2.245 2.049-3.025.954.78 1.851 2.146 2.048 3.025.196.878-.26 2.606-2.048 2.606', clipRule: 'evenodd' }],
]

const Dashboard = createIcon('Dashboard', iconNode, false)
export default Dashboard

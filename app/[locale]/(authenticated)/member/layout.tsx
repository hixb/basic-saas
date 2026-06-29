import type { ReactNode } from 'react'
import { MemberSidebar } from '~/components/member/MemberSidebar'

export default function MemberLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="h-dvh w-full sm:flex">
      <MemberSidebar />
      {children}
    </div>
  )
}

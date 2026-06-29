import { AdminMain } from '~/components/admin/AdminMain'
import { TableWrapper } from '~/components/admin/users/TableWrapper'
import { UserStats } from '~/components/admin/users/UserStats'

export default function AdminUsersPage() {
  return (
    <AdminMain
      description="Monitor and manage all registered platform users."
      title="User Management"
    >
      <div className="space-y-6">
        <UserStats />
        <TableWrapper />
      </div>
    </AdminMain>
  )
}

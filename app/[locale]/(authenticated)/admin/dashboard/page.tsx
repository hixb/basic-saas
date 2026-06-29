import { AdminMain } from '~/components/admin/AdminMain'
import { Dashboard } from '~/components/admin/Dashboard'

export default function AdminDashboardPage() {
  return (
    <AdminMain title="Good morning, Kate">
      <Dashboard />
    </AdminMain>
  )
}

import { AdminMain } from '~/components/admin/AdminMain'
import { SettingMain } from '~/components/admin/settings/SettingMain'

export default function AdminSettingsPage() {
  return (
    <AdminMain title="Settings">
      <div className="space-y-6">
        <SettingMain />
      </div>
    </AdminMain>
  )
}

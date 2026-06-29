import { getTranslations } from 'next-intl/server'
import { AdminMain } from '~/components/admin/AdminMain'
import { SettingMain } from '~/components/admin/settings/SettingMain'

export default async function AdminSettingsPage() {
  const t = await getTranslations('common')

  return (
    <AdminMain description={t('admin.pages.settings.description')} title={t('admin.pages.settings.title')}>
      <div className="space-y-6">
        <SettingMain />
      </div>
    </AdminMain>
  )
}

import { getTranslations } from 'next-intl/server'
import { AdminMain } from '~/components/admin/AdminMain'
import { Dashboard } from '~/components/admin/Dashboard'
import { getDashboardSummary } from '~/server/application/admin/dashboard.query'

export default async function AdminDashboardPage() {
  const [t, data] = await Promise.all([
    getTranslations('common'),
    getDashboardSummary(),
  ])

  return (
    <AdminMain description={t('admin.pages.dashboard.description')} title={t('admin.pages.dashboard.title')}>
      <Dashboard data={data} />
    </AdminMain>
  )
}

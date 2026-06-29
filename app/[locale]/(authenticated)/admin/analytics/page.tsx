import { getTranslations } from 'next-intl/server'
import { AdminMain } from '~/components/admin/AdminMain'
import { AnalyticsDashboard } from '~/components/admin/analytics/AnalyticsDashboard'
import { AnalyticsRepository } from '~/server/infrastructure/database/repositories/analytics.repository'

const analyticsRepository = new AnalyticsRepository()

export default async function AdminAnalyticsPage() {
  const [t, overview] = await Promise.all([
    getTranslations('common'),
    analyticsRepository.getOverview(),
  ])

  return (
    <AdminMain description={t('admin.pages.analytics.description')} title={t('admin.pages.analytics.title')}>
      <AnalyticsDashboard overview={overview} />
    </AdminMain>
  )
}

import { getTranslations } from 'next-intl/server'
import { AdminMain } from '~/components/admin/AdminMain'
import { SensitiveWordsTable } from '~/components/admin/sensitive-words/SensitiveWordsTable'

export default async function AdminSensitiveWordsPage() {
  const t = await getTranslations('common')

  return (
    <AdminMain
      description={t('admin.pages.sensitiveWords.description')}
      title={t('admin.pages.sensitiveWords.title')}
    >
      <SensitiveWordsTable />
    </AdminMain>
  )
}

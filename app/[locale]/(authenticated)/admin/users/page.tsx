import { getTranslations } from 'next-intl/server'
import { AdminMain } from '~/components/admin/AdminMain'
import { TableWrapper } from '~/components/admin/users/TableWrapper'
import { UserStats } from '~/components/admin/users/UserStats'

export default async function AdminUsersPage() {
  const t = await getTranslations('common')

  return (
    <AdminMain
      description={t('admin.pages.users.description')}
      title={t('admin.pages.users.title')}
    >
      <div className="space-y-6">
        <UserStats />
        <TableWrapper />
      </div>
    </AdminMain>
  )
}

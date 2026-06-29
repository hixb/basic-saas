import { getTranslations } from 'next-intl/server'
import { AdminMain } from '~/components/admin/AdminMain'
import { InquiriesTable } from '~/components/admin/inquiries/InquiriesTable'

export default async function AdminInquiriesPage() {
  const t = await getTranslations('common')

  return (
    <AdminMain
      description={t('admin.pages.inquiries.description')}
      title={t('admin.pages.inquiries.title')}
    >
      <InquiriesTable />
    </AdminMain>
  )
}

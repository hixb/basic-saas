import { getTranslations } from 'next-intl/server'
import { AdminMain } from '~/components/admin/AdminMain'
import { MaterialsTable } from '~/components/admin/materials/MaterialsTable'

export default async function AdminMaterialsPage() {
  const t = await getTranslations('common')

  return (
    <AdminMain
      description={t('admin.pages.materials.description')}
      title={t('admin.pages.materials.title')}
    >
      <MaterialsTable />
    </AdminMain>
  )
}

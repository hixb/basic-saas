import { getTranslations } from 'next-intl/server'
import { AdminMain } from '~/components/admin/AdminMain'
import { MaterialCategoriesTable } from '~/components/admin/material-categories/MaterialCategoriesTable'

export default async function AdminMaterialCategoriesPage() {
  const t = await getTranslations('common')

  return (
    <AdminMain
      description={t('admin.pages.materialCategories.description')}
      title={t('admin.pages.materialCategories.title')}
    >
      <MaterialCategoriesTable />
    </AdminMain>
  )
}

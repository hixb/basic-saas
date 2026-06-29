import { AdminMain } from '~/components/admin/AdminMain'
import { MaterialFormPage } from '~/components/admin/materials/MaterialFormPage'

export default async function AdminMaterialAddPage() {
  return (
    <AdminMain>
      <MaterialFormPage mode="create" />
    </AdminMain>
  )
}

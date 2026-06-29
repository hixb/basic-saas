import { AdminMain } from '~/components/admin/AdminMain'
import { MaterialFormPage } from '~/components/admin/materials/MaterialFormPage'

interface AdminMaterialEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminMaterialEditPage({ params }: AdminMaterialEditPageProps) {
  const { id } = await params

  return (
    <AdminMain>
      <MaterialFormPage materialId={Number(id)} mode="edit" />
    </AdminMain>
  )
}

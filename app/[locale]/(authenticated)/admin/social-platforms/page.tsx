import { getTranslations } from 'next-intl/server'
import { AdminMain } from '~/components/admin/AdminMain'
import { SocialPlatformsTable } from '~/components/admin/social-platforms/SocialPlatformsTable'

export default async function AdminSocialPlatformsPage() {
  const t = await getTranslations('common')

  return (
    <AdminMain
      description={t('admin.pages.socialPlatforms.description')}
      title={t('admin.pages.socialPlatforms.title')}
    >
      <SocialPlatformsTable />
    </AdminMain>
  )
}

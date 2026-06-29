import { getTranslations } from 'next-intl/server'
import { MemberMain } from '~/components/member/MemberMain'
import { Settings } from '~/components/member/Settings'

export default async function MemberSettingsPage() {
  const t = await getTranslations('common')

  return (
    <MemberMain description={t('member.pages.settings.description')} title={t('member.pages.settings.title')}>
      <Settings />
    </MemberMain>
  )
}

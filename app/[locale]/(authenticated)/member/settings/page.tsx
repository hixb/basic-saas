import { MemberMain } from '~/components/member/MemberMain'
import { Settings } from '~/components/member/Settings'

export default function MemberSettingsPage() {
  return (
    <MemberMain description="Customize settings, email preferences, and web appearance." title="Settings">
      <Settings />
    </MemberMain>
  )
}

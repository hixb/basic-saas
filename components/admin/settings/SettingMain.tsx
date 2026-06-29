'use client'

import type { SyntheticEvent } from 'react'
import {
  Avatar,
  Button,
  Card,
  Description,
  FieldError,
  Form,
  InputGroup,
  InputOTP,
  Label,
  REGEXP_ONLY_DIGITS,
  Separator,
  Spinner,
  Switch,
  Tabs,
  TextField,
} from '@heroui/react'
import { Bell, Camera, Check, CheckCheck, Copy, Eye, EyeOff, KeyRound, Laptop, Mail, Shield, Smartphone, User } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useRef, useState } from 'react'
import { Popup } from '~/context/usePopupContext'
import { cn } from '~/lib/utils/tools'

function getStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw)
    return 0
  let s = 0
  if (pw.length >= 8)
    s++
  if (/[A-Z]/.test(pw))
    s++
  if (/\d/.test(pw))
    s++
  if (/[^A-Z0-9]/i.test(pw))
    s++
  return s as 0 | 1 | 2 | 3 | 4
}

const STRENGTH_META: Record<number, { label: string, color: string, text: string }> = {
  0: { label: 'Too Weak', color: 'bg-danger', text: 'text-danger' },
  1: { label: 'Weak', color: 'bg-danger', text: 'text-danger' },
  2: { label: 'Fair', color: 'bg-warning', text: 'text-warning' },
  3: { label: 'Good', color: 'bg-success/70', text: 'text-success' },
  4: { label: 'Strong', color: 'bg-success', text: 'text-success' },
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getStrength(password)

  if (!password)
    return null

  const meta = STRENGTH_META[strength]

  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= strength ? meta.color : 'bg-foreground/10')}
            key={i}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', meta.text)}>{meta.label}</p>
    </div>
  )
}

function ProfileSection() {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file)
      setAvatarSrc(URL.createObjectURL(file))
  }

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)

    setTimeout(() => {
      setIsSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }, 1200)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Card.Content>
          <div className="flex flex-col items-center gap-4 rounded-xl bg-linear-to-b from-accent/10 via-accent/5 to-transparent px-6 pb-7 pt-8">
            <input accept="image/*" className="hidden" onChange={handleFile} ref={fileRef} type="file" />
            <div
              className="group relative cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <Avatar className="size-20 ring-4 ring-background shadow-md">
                <Avatar.Image
                  alt="Profile"
                  src={avatarSrc ?? 'https://img.heroui.chat/image/avatar?w=200&h=200&u=1'}
                />
                <Avatar.Fallback>AU</Avatar.Fallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Camera className="size-5 text-white" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Admin User</p>
              <p className="mt-0.5 text-xs text-muted">admin@example.com</p>
            </div>
            <div className="flex gap-2">
              <Button onPress={() => fileRef.current?.click()} size="sm" variant="secondary">
                <Camera className="size-3.5" />
                Change Photo
              </Button>
              {avatarSrc && (
                <Button onPress={() => setAvatarSrc(null)} size="sm" variant="tertiary">
                  Remove
                </Button>
              )}
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
              <User className="size-4 text-muted" />
            </div>
            <Card.Title>Personal Information</Card.Title>
          </div>
        </Card.Header>
        <Card.Content>
          <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField defaultValue="Admin" fullWidth name="firstName">
                <Label>First Name</Label>
                <InputGroup variant="secondary">
                  <InputGroup.Input placeholder="First name" />
                </InputGroup>
                <FieldError />
              </TextField>
              <TextField defaultValue="User" fullWidth name="lastName">
                <Label>Last Name</Label>
                <InputGroup variant="secondary">
                  <InputGroup.Input placeholder="Last name" />
                </InputGroup>
                <FieldError />
              </TextField>
            </div>
            <TextField defaultValue="admin@example.com" fullWidth isDisabled name="email" type="email">
              <Label>Email Address</Label>
              <InputGroup variant="secondary">
                <InputGroup.Input />
              </InputGroup>
              <Description>Email cannot be changed. Contact support if needed.</Description>
            </TextField>
            <TextField fullWidth name="bio">
              <Label>Bio</Label>
              <InputGroup variant="secondary">
                <InputGroup.TextArea className="h-32" placeholder="Write a short description about yourself..." />
              </InputGroup>
            </TextField>
          </Form>
        </Card.Content>
        <Card.Footer className="justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
              <Check className="size-3.5" />
              Saved
            </span>
          )}
          <Button isPending={isSaving} onPress={() => (document.querySelector('form') as HTMLFormElement)?.requestSubmit()}>
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                Save Changes
              </>
            )}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  )
}

const TWO_FA_SECRET = 'JBSW Y3DP EHPK 3PXP'

function TwoFactorSetupContent() {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(TWO_FA_SECRET.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="shrink-0 overflow-hidden rounded-xl bg-surface-secondary p-3 flex items-center justify-center">
          <QRCodeSVG
            bgColor="var(--color-default)"
            fgColor="var(--foreground)"
            level="L"
            size={128}
            title="Title for my QR Code"
            value="https://picturesofpeoplescanningqrcodes.tumblr.com/"
          />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Scan with your app</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Open Google Authenticator, Authy, or any TOTP-compatible app and scan the QR code.
            </p>
          </div>

          <div className="rounded-lg bg-surface-secondary px-3 py-2.5">
            <p className="text-[11px] text-muted">Can't scan? Enter this key manually</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <code className="text-xs font-mono tracking-wider text-foreground">{TWO_FA_SECRET}</code>
              <Button
                className="min-w-8 w-8"
                isIconOnly
                onPress={handleCopy}
                size="sm"
                variant={copied ? 'primary' : 'secondary'}
              >
                {copied ? <CheckCheck className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-1.5">
        <Label>Enter the 6-digit code from your app</Label>
        <InputOTP className="p-1" maxLength={6} onChange={setCode} pattern={REGEXP_ONLY_DIGITS} value={code} variant="secondary">
          <InputOTP.Group>
            <InputOTP.Slot index={0} />
            <InputOTP.Slot index={1} />
            <InputOTP.Slot index={2} />
          </InputOTP.Group>
          <InputOTP.Separator />
          <InputOTP.Group>
            <InputOTP.Slot index={3} />
            <InputOTP.Slot index={4} />
            <InputOTP.Slot index={5} />
          </InputOTP.Group>
        </InputOTP>
      </div>
    </div>
  )
}

function EyeToggle({ isShown, onToggle }: { isShown: boolean, onToggle: () => void }) {
  return (
    <Button aria-label="Toggle visibility" className="size-7" onPress={onToggle} size="sm" variant="ghost">
      {isShown ? <EyeOff size={14} /> : <Eye size={14} />}
    </Button>
  )
}

const SESSIONS = [
  { device: 'MacBook Pro 16"', meta: 'Shanghai · Chrome 122 · 2 min ago', Icon: Laptop, current: true },
  { device: 'iPhone 15 Pro', meta: 'Shanghai · Safari 17 · 3 hours ago', Icon: Smartphone, current: false },
  { device: 'Windows PC', meta: 'Beijing · Edge 121 · 2 days ago', Icon: Laptop, current: false },
]

function SecuritySection() {
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false })
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [twoFa, setTwoFa] = useState(false)

  const toggleShow = (k: keyof typeof show) => setShow(p => ({ ...p, [k]: !p[k] }))

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)

    setTimeout(() => {
      setIsSaving(false)
      setSaved(true)
      setNewPassword('')
      setTimeout(() => setSaved(false), 2500)
    }, 1200)
  }

  const onChengTowFactorAuth = useCallback((isSelected: boolean) => {
    setTwoFa(isSelected)

    if (isSelected) {
      Popup.ActionDialog.visible({
        title: 'Set Up Two-Factor Authentication',
        content: <TwoFactorSetupContent />,
        confirmText: 'Confirm & Enable',
        onConfirm: async () => {},
        size: 'lg',
        status: 'accent',
      })
    }
  }, [twoFa, setTwoFa])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
              <KeyRound className="size-4 text-muted" />
            </div>
            <Card.Title>Change Password</Card.Title>
          </div>
        </Card.Header>
        <Card.Content>
          <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <TextField fullWidth isRequired name="currentPassword" type={show.current ? 'text' : 'password'}>
              <Label>Current Password</Label>
              <InputGroup variant="secondary">
                <InputGroup.Input placeholder="Enter your current password" />
                <InputGroup.Suffix><EyeToggle isShown={show.current} onToggle={() => toggleShow('current')} /></InputGroup.Suffix>
              </InputGroup>
              <FieldError />
            </TextField>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <TextField fullWidth isRequired minLength={8} name="newPassword" onChange={setNewPassword} type={show.newPw ? 'text' : 'password'} value={newPassword}>
                  <Label>New Password</Label>
                  <InputGroup variant="secondary">
                    <InputGroup.Input placeholder="At least 8 characters" />
                    <InputGroup.Suffix><EyeToggle isShown={show.newPw} onToggle={() => toggleShow('newPw')} /></InputGroup.Suffix>
                  </InputGroup>
                  <FieldError />
                </TextField>
                <PasswordStrengthBar password={newPassword} />
              </div>
              <TextField fullWidth isRequired name="confirmPassword" type={show.confirm ? 'text' : 'password'}>
                <Label>Confirm Password</Label>
                <InputGroup variant="secondary">
                  <InputGroup.Input placeholder="Repeat new password" />
                  <InputGroup.Suffix><EyeToggle isShown={show.confirm} onToggle={() => toggleShow('confirm')} /></InputGroup.Suffix>
                </InputGroup>
                <FieldError />
              </TextField>
            </div>
          </Form>
        </Card.Content>
        <Card.Footer className="justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
              <Check className="size-3.5" />
              Updated
            </span>
          )}
          <Button isPending={isSaving} onPress={() => (document.querySelector('[name=currentPassword]')?.closest('form') as HTMLFormElement)?.requestSubmit()}>
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                Update Password
              </>
            )}
          </Button>
        </Card.Footer>
      </Card>

      <Card>
        <Card.Content>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
                <Shield className="size-4 text-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
                <p className="mt-0.5 text-xs text-muted">
                  {twoFa
                    ? 'Your account is protected with a second verification step.'
                    : 'Require a code alongside your password when signing in.'}
                </p>
              </div>
            </div>
            <Switch isSelected={twoFa} onChange={onChengTowFactorAuth}>
              <Switch.Control><Switch.Thumb /></Switch.Control>
            </Switch>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Active Sessions</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col">
          {SESSIONS.map((s, i) => (
            <div key={s.device}>
              {i > 0 && <Separator className="my-3" />}
              <div className={cn('flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 -mx-3', s.current && 'bg-accent/5')}>
                <div className="flex items-center gap-3">
                  <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', s.current ? 'bg-accent/10' : 'bg-surface-secondary')}>
                    <s.Icon className={cn('size-4', s.current ? 'text-accent' : 'text-muted')} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{s.device}</p>
                      {s.current && (
                        <span className="rounded-full bg-success/10 px-2 py-px text-xs font-medium text-success">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">{s.meta}</p>
                  </div>
                </div>
                {!s.current && (
                  <Button size="sm" variant="danger-soft">Revoke</Button>
                )}
              </div>
            </div>
          ))}
        </Card.Content>
      </Card>
    </div>
  )
}

const EMAIL_ITEMS = [
  { key: 'loginAlert', label: 'Login Alerts', desc: 'Get notified whenever a new sign-in is detected on your account.', Icon: Shield, default: true },
  { key: 'securityUpdates', label: 'Security Updates', desc: 'Critical security announcements and important policy changes.', Icon: KeyRound, default: true },
  { key: 'productNews', label: 'Product Updates', desc: 'New features, improvements and release notes from the team.', Icon: Mail, default: false },
]

const PUSH_ITEMS = [
  { key: 'realtimeAlerts', label: 'Real-time Alerts', desc: 'Instant push notifications for critical system events.', Icon: Bell, default: true },
  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'A curated weekly summary of activity in your account.', Icon: Mail, default: false },
]

function NotificationsSection() {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries([...EMAIL_ITEMS, ...PUSH_ITEMS].map(i => [i.key, i.default])),
  )
  const toggle = (key: string) => (val: boolean) => setSettings(p => ({ ...p, [key]: val }))

  const renderGroup = (items: typeof EMAIL_ITEMS) =>
    items.map((item, i) => (
      <div key={item.key}>
        {i > 0 && <Separator className="my-4" />}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
              <item.Icon className="size-4 text-muted" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted leading-relaxed">{item.desc}</p>
            </div>
          </div>
          <Switch isSelected={settings[item.key]} onChange={toggle(item.key)}>
            <Switch.Control><Switch.Thumb /></Switch.Control>
          </Switch>
        </div>
      </div>
    ))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
              <Mail className="size-4 text-muted" />
            </div>
            <Card.Title>Email Notifications</Card.Title>
          </div>
          <p className="mt-1 pl-10 text-sm text-muted">Sent to admin@example.com.</p>
        </Card.Header>
        <Card.Content>{renderGroup(EMAIL_ITEMS)}</Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
              <Bell className="size-4 text-muted" />
            </div>
            <Card.Title>Push Notifications</Card.Title>
          </div>
          <p className="mt-1 pl-10 text-sm text-muted">Browser and mobile push alert preferences.</p>
        </Card.Header>
        <Card.Content>{renderGroup(PUSH_ITEMS)}</Card.Content>
      </Card>
    </div>
  )
}

export function SettingMain() {
  return (
    <Tabs defaultSelectedKey="profile">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Settings sections">
          <Tabs.Tab id="profile">
            Profile
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="security">
            <Tabs.Separator />
            Security
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="notifications">
            <Tabs.Separator />
            Notifications
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>

      <Tabs.Panel id="profile">
        <ProfileSection />
      </Tabs.Panel>
      <Tabs.Panel id="security">
        <SecuritySection />
      </Tabs.Panel>
      <Tabs.Panel id="notifications">
        <NotificationsSection />
      </Tabs.Panel>
    </Tabs>
  )
}

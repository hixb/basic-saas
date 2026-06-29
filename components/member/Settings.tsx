'use client'

import type { Key } from '@heroui/react'
import type { ReactNode } from 'react'
import {
  AlertDialog,
  Avatar,
  Button,
  Card,
  ComboBox,
  Header,
  Input,
  ListBox,
  ListBoxLoadMoreItem,
  Separator,
  Spinner,
  Switch,
  Tabs,
  TextArea,
} from '@heroui/react'
import { formatInTimeZone } from 'date-fns-tz'
import { Pencil } from 'lucide-react'
import Image from 'next/image'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { useAsyncList } from '~/hooks/useAsyncList'
import { cn } from '~/lib/utils/tools'

interface Timezone {
  value: string
  label: string
  offset: string
}

interface TimezoneGroup {
  region: string
  timezones: Timezone[]
}

interface ColumnProps {
  title: string
  children: ReactNode
  description?: string
  className?: string
}

let cachedFlatTimezones: Array<{ region: string, timezone: Timezone }> | null = null

function Column(props: ColumnProps) {
  return (
    <section className="mb-4 last:mb-0">
      <h3 className="text-base font-medium text-default-foreground">{props.title}</h3>
      {props.description && <p className="mt-1 text-sm text-muted">{props.description}</p>}
      <div className={cn('mt-2', props.className)}>
        {props.children}
      </div>
    </section>
  )
}

function Profile() {
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [inputValue, setInputValue] = useState('')

  const list = useAsyncList<TimezoneGroup>({
    async load({ cursor, signal }) {
      await new Promise(resolve => setTimeout(resolve, 500))

      if (signal.aborted) {
        throw new Error('Aborted')
      }

      const page = cursor ? Number.parseInt(cursor) : 0
      const pageSize = 20
      const items = getTimezonesGroupedPage(page, pageSize)

      const totalCount = cachedFlatTimezones?.length ?? Intl.supportedValuesOf('timeZone').length
      const hasMore = (page + 1) * pageSize < totalCount

      return {
        items,
        cursor: hasMore ? String(page + 1) : undefined,
      }
    },
  })

  const lowerInputValue = useMemo(() =>
    inputValue.toLowerCase(), [inputValue])

  const filteredItems = useMemo(() => {
    if (!inputValue) {
      return list.items
    }

    return list.items.map(group => ({
      region: group.region,
      timezones: group.timezones.filter(tz =>
        tz.label.toLowerCase().includes(lowerInputValue)
        || tz.value.toLowerCase().includes(lowerInputValue)
        || tz.offset.includes(inputValue),
      ),
    })).filter(group => group.timezones.length > 0)
  }, [list.items, inputValue, lowerInputValue])

  const timezoneMap = useMemo(() => {
    const map = new Map<string, Timezone>()
    list.items.forEach((group) => {
      group.timezones.forEach((tz) => {
        map.set(tz.value, tz)
      })
    })
    return map
  }, [list.items])

  const handleSelectionChange = useCallback((key: Key | null) => {
    if (key) {
      setTimezone(key as string)

      const selectedTz = timezoneMap.get(key as string)

      if (selectedTz) {
        setInputValue(selectedTz.label)
      }
    }
  }, [timezoneMap])

  return (
    <>
      <Column description="Upload and manage your profile picture visible to other users." title="Profile">
        <Card>
          <Card.Content>
            <div className="flex items-center gap-4">
              <Avatar className="overflow-visible" size="lg">
                <Avatar.Image alt="John Doe" className="rounded-full" src="https://img.heroui.chat/image/avatar?w=400&h=400&u=3" />
                <Avatar.Fallback>JD</Avatar.Fallback>

                <Button className="absolute -right-1 bottom-0 size-5" isIconOnly variant="tertiary">
                  <Pencil className="size-2.5" />
                </Button>
              </Avatar>
              <div className="flex flex-col h-full">
                <p className="text-sm font-medium">Kate Moore</p>
                <p className="mt-2 text-xs text-muted">Example@example.com</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </Column>
      <Column description="Your unique username for identification across the platform." title="Username">
        <Input aria-label="Username" className="w-full" placeholder="Enter your username" />
      </Column>
      <Column description="Add a brief description about yourself to share with others." title="Personal Profile">
        <TextArea
          aria-label="Enter your personal profile"
          className="w-full h-32 max-h-40"
          placeholder="Enter your personal profile"
        />
      </Column>
      <Column
        className="flex gap-2 items-end"
        description="Select your timezone for accurate time display"
        title="Timezone"
      >
        <ComboBox
          aria-label="Timezone"
          className="w-full"
          inputValue={inputValue}
          menuTrigger="focus"
          onInputChange={setInputValue}
          onSelectionChange={handleSelectionChange}
          selectedKey={timezone}
        >
          <ComboBox.InputGroup>
            <Input placeholder="Search timezone..." />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            {list.loadingState === 'loading'
              ? (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Spinner size="sm" />
                    <span className="text-muted text-sm">Loading timezones...</span>
                  </div>
                )
              : (
                  <ListBox className="max-h-80 overflow-auto">
                    {filteredItems.length === 0
                      ? (
                          <ListBox.Item textValue="No results">
                            <div className="text-sm text-muted py-2 text-center">
                              No timezones found
                            </div>
                          </ListBox.Item>
                        )
                      : (
                          <>
                            {filteredItems.map((group, groupIndex) => (
                              <Fragment key={`${group.region}-${group.timezones[0]?.value || groupIndex}`}>
                                <ListBox.Section>
                                  <Header>{group.region}</Header>
                                  {group.timezones.map(tz => (
                                    <ListBox.Item id={tz.value} key={tz.value} textValue={tz.label}>
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-sm">{tz.label}</span>
                                        <span className="text-xs text-muted ml-2">{tz.offset}</span>
                                      </div>
                                      <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                  ))}
                                </ListBox.Section>
                                {groupIndex < filteredItems.length - 1 && <Separator />}
                              </Fragment>
                            ))}

                            {!inputValue && (
                              <ListBoxLoadMoreItem
                                isLoading={list.loadingState === 'loadingMore'}
                                onLoadMore={list.loadMore}
                              >
                                <div className="flex items-center justify-center gap-2 py-2">
                                  {list.loadingState === 'loadingMore' && <Spinner size="sm" />}
                                  <span className="text-muted text-sm">
                                    {list.loadingState === 'loadingMore'
                                      ? 'Loading more...'
                                      : ''}
                                  </span>
                                </div>
                              </ListBoxLoadMoreItem>
                            )}
                          </>
                        )}
                  </ListBox>
                )}
          </ComboBox.Popover>
        </ComboBox>
      </Column>
      <Button className="w-full" isDisabled>Save</Button>
    </>
  )
}

function Billing() {
  return (
    <Card>
      <Card.Content className="flex flex-row items-center justify-between">
        <div className="flex items-center mr-4">
          <Image
            alt="Payment method logo"
            className="mr-2"
            height={64}
            src="/logos/stripe.svg"
            width={64}
          />
          <Card.Header>
            <Card.Title>
              Payment method
            </Card.Title>
            <Card.Description>
              Stripe
            </Card.Description>
          </Card.Header>
        </div>
        <Button variant="tertiary">Update</Button>
      </Card.Content>
    </Card>
  )
}

function Security() {
  return (
    <>
      <Column className="flex gap-2" description="Update your password to keep your account secure." title="Password">
        <Input aria-label="Password" className="w-full" placeholder="Enter your password" type="password" />
        <Button isDisabled variant="tertiary">Save</Button>
      </Column>
    </>
  )
}

function Privacy() {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [cookiePrefs, setCookiePrefs] = useState({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  })

  const handleExportData = async () => {
    setIsExporting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsExporting(false)
  }

  const handleSaveCookiePrefs = () => {
  }

  const handleDeleteAccount = () => {
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <Column
        description="Download a copy of all your personal data stored in our system."
        title="Data Export"
      >
        <Card>
          <Card.Content>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-default-foreground">
                Request a copy of your data including profile information, settings, and activity history.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted">
                  Format: JSON • Last exported: Never
                </div>
                <Button
                  isDisabled={isExporting}
                  onPress={handleExportData}
                  variant="tertiary"
                >
                  {isExporting
                    ? 'Exporting...'
                    : 'Export Data'}
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      </Column>

      <Column
        description="Manage how we use cookies to improve your experience."
        title="Cookie Preferences"
      >
        <Card>
          <Card.Content>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-default-foreground">Necessary Cookies</p>
                  <p className="text-xs text-muted mt-1">Required for the website to function properly</p>
                </div>
                <Switch isDisabled isSelected={cookiePrefs.necessary} size="sm" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-default-foreground">Functional Cookies</p>
                  <p className="text-xs text-muted mt-1">Remember your preferences and settings</p>
                </div>
                <Switch
                  isSelected={cookiePrefs.functional}
                  onChange={value => setCookiePrefs(prev => ({ ...prev, functional: value }))}
                  size="sm"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-default-foreground">Analytics Cookies</p>
                  <p className="text-xs text-muted mt-1">Help us understand how you use our site</p>
                </div>
                <Switch
                  isSelected={cookiePrefs.analytics}
                  onChange={value => setCookiePrefs(prev => ({ ...prev, analytics: value }))}
                  size="sm"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-default-foreground">Marketing Cookies</p>
                  <p className="text-xs text-muted mt-1">Used to deliver personalized advertisements</p>
                </div>
                <Switch
                  isSelected={cookiePrefs.marketing}
                  onChange={value => setCookiePrefs(prev => ({ ...prev, marketing: value }))}
                  size="sm"
                />
              </div>

              <div className="flex justify-end mt-2">
                <Button onPress={handleSaveCookiePrefs} variant="tertiary">
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      </Column>

      <Column
        description="Permanently delete your account and all associated data."
        title="Delete Account"
      >
        <Card>
          <Card.Content>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm text-default-foreground">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <ul className="text-xs text-muted mt-2 space-y-1 list-disc list-inside">
                    <li>All your data will be permanently deleted</li>
                    <li>You will lose access to all services</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  className="text-danger"
                  onPress={() => setIsDeleteDialogOpen(true)}
                  variant="tertiary"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>

        <AlertDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[400px]">
              {() => (
                <>
                  <AlertDialog.Header>
                    <AlertDialog.Icon status="danger" />
                    <AlertDialog.Heading>Delete Account</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    <p className="text-sm text-default-foreground">
                      Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
                    </p>
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <div className="flex gap-2 justify-end w-full">
                      <Button onPress={() => setIsDeleteDialogOpen(false)} variant="tertiary">
                        Cancel
                      </Button>
                      <Button className="bg-danger text-danger-foreground" onPress={handleDeleteAccount}>
                        Delete Account
                      </Button>
                    </div>
                  </AlertDialog.Footer>
                </>
              )}
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog>
      </Column>
    </>
  )
}

export function Settings() {
  const tabs = [
    { id: 'profile', title: 'Profile', component: Profile },
    { id: 'security', title: 'Security', component: Security },
    { id: 'billing', title: 'Billing & Subscription', component: Billing },
    { id: 'privacy', title: 'Privacy & Data', component: Privacy },
  ]

  return (
    <section className="w-full max-w-2xl flex-1 sm:mt-6">
      <Tabs className="w-full">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Options" className="overflow-x-auto">
            {tabs.map(tab => (
              <Tabs.Tab className="flex-1" id={tab.id} key={tab.id}>
                <span className="inline-block w-full truncate">{tab.title}</span>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
        {tabs.map(tab => (
          <Tabs.Panel className="pt-4 px-0 pb-0" id={tab.id} key={tab.id}>
            <tab.component />
          </Tabs.Panel>
        ))}
      </Tabs>
    </section>
  )
}

function getTimezonesGroupedPage(page: number, pageSize: number = 20): TimezoneGroup[] {
  if (!cachedFlatTimezones) {
    const now = new Date()
    const allTimezones = Intl.supportedValuesOf('timeZone')
    const regionOrder = [
      'America',
      'Europe',
      'Asia',
      'Africa',
      'Australia',
      'Pacific',
      'Atlantic',
      'Indian',
      'Antarctica',
      'Arctic',
      'Etc',
    ]

    const regionOrderMap = new Map(regionOrder.map((r, i) => [r, i]))

    const allGroups = new Map<string, Timezone[]>()

    allTimezones.forEach((tz) => {
      const parts = tz.split('/')
      const region = parts[0]
      const offset = formatInTimeZone(now, tz, 'XXX')
      const time = formatInTimeZone(now, tz, 'HH:mm')

      const timezone: Timezone = {
        value: tz,
        label: `${parts[1]?.replace(/_/g, ' ') || tz} - ${time}`,
        offset,
      }

      if (!allGroups.has(region)) {
        allGroups.set(region, [])
      }
      allGroups.get(region)!.push(timezone)
    })

    const sortedGroups = Array.from(allGroups.entries())
      .sort(([a], [b]) => {
        const indexA = regionOrderMap.get(a) ?? 999
        const indexB = regionOrderMap.get(b) ?? 999
        if (indexA === indexB)
          return a.localeCompare(b)
        return indexA - indexB
      })

    cachedFlatTimezones = []
    sortedGroups.forEach(([region, timezones]) => {
      timezones.sort((a, b) => a.offset.localeCompare(b.offset))
      timezones.forEach((tz) => {
        cachedFlatTimezones!.push({ region, timezone: tz })
      })
    })
  }

  const start = page * pageSize
  const end = start + pageSize
  const pageTimezones = cachedFlatTimezones.slice(start, end)

  const result = new Map<string, Timezone[]>()
  pageTimezones.forEach(({ region, timezone }) => {
    let group = result.get(region)
    if (!group) {
      group = []
      result.set(region, group)
    }
    group.push(timezone)
  })

  return Array.from(result.entries()).map(([region, timezones]) => ({
    region,
    timezones,
  }))
}

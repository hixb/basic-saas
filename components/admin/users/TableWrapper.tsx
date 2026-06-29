'use client'

import type { ColumnDef, CrudOperations } from '~/components/crud'
import { Chip, FieldError, Input, Label, ListBox, Select, TextField } from '@heroui/react'
import { Controller } from 'react-hook-form'
import { CrudTable } from '~/components/crud'
import { CopyText } from '~/components/feedback/CopyText'
import { useCrudTable } from '~/hooks/useCrudTable'
import { usePendingFilters } from '~/hooks/usePendingFilters'

interface User {
  id: number
  username: string
  email: string
  status: 'active' | 'inactive'
  createdAt: string
}

interface CreateUserDto {
  username: string
  email: string
}

interface UpdateUserDto {
  username?: string
  email?: string
  status?: 'active' | 'inactive'
}

const FIRST_NAMES = ['alice', 'bob', 'carol', 'dave', 'eve', 'frank', 'grace', 'henry', 'iris', 'jack', 'karen', 'leo', 'mia', 'noah', 'olivia', 'peter', 'quinn', 'rachel', 'sam', 'tina', 'uma', 'victor', 'wendy', 'xavier', 'yara', 'zoe']
const DOMAINS = ['example.com', 'mail.com', 'inbox.dev', 'webmail.io', 'fastmail.net', 'proton.me']

const mockDb: User[] = Array.from({ length: 100000 }, (_, i) => {
  const id = i + 1
  const name = `${FIRST_NAMES[i % FIRST_NAMES.length]}${Math.floor(i / FIRST_NAMES.length) || ''}`
  const domain = DOMAINS[i % DOMAINS.length]
  const status: 'active' | 'inactive' = i % 5 === 0 ? 'inactive' : 'active'
  const baseDate = new Date('2022-01-01T00:00:00Z').getTime()
  const createdAt = new Date(baseDate + i * 3_600_000).toISOString()
  return { id, username: name, email: `${name}@${domain}`, status, createdAt }
})
let nextId = mockDb.length + 1

const operations: CrudOperations<User, CreateUserDto, UpdateUserDto> = {
  list: async ({ page, pageSize, keyword, filters }) => {
    await new Promise(r => setTimeout(r, 300))

    let rows = [...mockDb]

    if (keyword) {
      const kw = keyword.toLowerCase()
      rows = rows.filter(u => u.username.includes(kw) || u.email.includes(kw))
    }

    if (filters?.status) {
      rows = rows.filter(u => u.status === filters.status)
    }

    const total = rows.length
    const items = rows.slice((page - 1) * pageSize, page * pageSize)

    return { items, total }
  },

  create: async (data) => {
    await new Promise(r => setTimeout(r, 300))
    mockDb.push({ id: nextId++, ...data, status: 'active', createdAt: new Date().toISOString() })
  },

  update: async (id, data) => {
    await new Promise(r => setTimeout(r, 300))
    const index = mockDb.findIndex(u => u.id === Number(id))
    if (index !== -1)
      mockDb[index] = { ...mockDb[index], ...data }
  },

  delete: async (id) => {
    await new Promise(r => setTimeout(r, 300))
    const index = mockDb.findIndex(u => u.id === Number(id))
    if (index !== -1)
      mockDb.splice(index, 1)
  },

  batchDelete: async (ids) => {
    await new Promise(r => setTimeout(r, 300))
    const numIds = ids.map(Number)
    for (let i = mockDb.length - 1; i >= 0; i--) {
      if (numIds.includes(mockDb[i].id))
        mockDb.splice(i, 1)
    }
  },
}

const columns: ColumnDef<User>[] = [
  { key: 'id', label: 'ID', isRowHeader: true, width: 100, render: row => <CopyText>{row.id}</CopyText> },
  { key: 'username', label: 'Username', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  {
    key: 'status',
    label: 'Status',
    render: row => (
      <Chip color={row.status === 'active' ? 'success' : 'danger'} size="sm" variant="soft">
        {row.status === 'active' ? 'Active' : 'Inactive'}
      </Chip>
    ),
  },
  {
    key: 'createdAt',
    label: 'Created At',
    render: row => new Date(row.createdAt).toLocaleDateString('en-US'),
  },
]

export function TableWrapper() {
  const handle = useCrudTable<User, CreateUserDto, UpdateUserDto>({
    operations,
    getRowId: row => row.id,
    selectable: true,
    syncUrl: true,
  })

  const { pending, setField, apply, clear } = usePendingFilters(handle.setFilters, handle.setKeyword, handle.filters)

  return (
    <CrudTable columns={columns} handle={handle}>
      <CrudTable.Toolbar createLabel="New User" showExport />
      <CrudTable.FilterPanel>
        <CrudTable.FilterPanel.Content onApply={apply} onClear={clear}>
          <Select
            onChange={value => setField('status', value != null ? String(value) : '')}
            placeholder="All statuses"
            value={pending.status ?? ''}
          >
            <Label>Status</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" key="all" textValue="All">
                  All
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="active" key="active" textValue="Active">
                  Active
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="inactive" key="inactive" textValue="Inactive">
                  Inactive
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            onChange={value => setField('registration', value != null ? String(value) : '')}
            placeholder="Any time"
            value={pending.registration ?? ''}
          >
            <Label>Registration</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="7d" key="7d" textValue="Last 7 days">
                  Last 7 days
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="30d" key="30d" textValue="Last 30 days">
                  Last 30 days
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="90d" key="90d" textValue="Last 90 days">
                  Last 90 days
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="all" key="all" textValue="All time">
                  All time
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            onChange={value => setField('plan', value != null ? String(value) : '')}
            placeholder="Any plan"
            value={pending.plan ?? ''}
          >
            <Label>Plan</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="free" key="free" textValue="Free">
                  Free
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="pro" key="pro" textValue="Pro">
                  Pro
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="enterprise" key="enterprise" textValue="Enterprise">
                  Enterprise
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </CrudTable.FilterPanel.Content>
      </CrudTable.FilterPanel>
      <CrudTable.Content aria-label="Users" expandable />
      <CrudTable.FormModal createTitle="New User" editTitle="Edit User" handle={handle}>
        {({ mode, data, form }) => (
          <>
            <TextField defaultValue={data?.username ?? ''} fullWidth isInvalid={!!form.formState.errors.username} isRequired>
              <Label>Username</Label>
              <Input {...form.register('username', { required: 'Username is required' })} variant="secondary" />
              <FieldError>{form.formState.errors.username?.message as string}</FieldError>
            </TextField>
            <TextField defaultValue={data?.email ?? ''} fullWidth isInvalid={!!form.formState.errors.email} isRequired>
              <Label>Email</Label>
              <Input type="email" {...form.register('email', { required: 'Email is required' })} variant="secondary" />
              <FieldError>{form.formState.errors.email?.message as string}</FieldError>
            </TextField>
            {mode === 'edit' && (
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    fullWidth
                    onChange={value => field.onChange(value)}
                    value={field.value ?? data?.status}
                    variant="secondary"
                  >
                    <Label>Status</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="active" key="active" textValue="Active">
                          Active
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="inactive" key="inactive" textValue="Inactive">
                          Inactive
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                )}
              />
            )}
          </>
        )}
      </CrudTable.FormModal>
    </CrudTable>
  )
}

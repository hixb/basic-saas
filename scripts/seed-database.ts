import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash } from 'bcryptjs'

const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'Admin123456'

function loadEnvFile() {
  const envPath = join(process.cwd(), '.env')
  const content = readFileSync(envPath, 'utf8')

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('='))
      continue

    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')

    process.env[key.trim()] ??= value
  }
}

const sensitiveWordSeedSource = 'LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words'

const defaultSensitiveWords = [
  { word: 'spam', severity: 'medium', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: 'scam', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: 'fraud', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: 'abuse', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: 'phishing', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: 'counterfeit', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: 'fake invoice', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: 'chargeback fraud', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: 'money laundering', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: 'stolen card', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: '毒品', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: '诈骗', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: '洗钱', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: '假货', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: '盗刷', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: '违禁品', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: '仿牌', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: '刷单', severity: 'medium', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: '虚假发票', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
  { word: '钓鱼链接', severity: 'high', note: `Seeded from ${sensitiveWordSeedSource}` },
]

async function seed() {
  loadEnvFile()

  const { db } = await import('~/server/infrastructure/database')
  const { permissions, PermissionType } = await import('~/server/infrastructure/database/schema/permission.schema')
  const { materialCategories } = await import('~/server/infrastructure/database/schema/material-category.schema')
  const { rolePermissions } = await import('~/server/infrastructure/database/schema/role-permission.schema')
  const { roles } = await import('~/server/infrastructure/database/schema/role.schema')
  const { sensitiveWords } = await import('~/server/infrastructure/database/schema/sensitive-word.schema')
  const { uploadedMaterials, UploadedMaterialStatus } = await import('~/server/infrastructure/database/schema/uploaded-material.schema')
  const { users } = await import('~/server/infrastructure/database/schema/user.schema')

  const defaultPermissions = [
    { type: PermissionType.MENU, slug: 'dashboard', name: 'Dashboard', parentId: 0, icon: 'dashboard', url: '/admin/dashboard', api: '', sort: 1 },
    { type: PermissionType.MENU, slug: 'users', name: 'Users', parentId: 0, icon: 'users', url: '/admin/users', api: JSON.stringify([{ method: 'GET', url: '/api/admin/users' }]), sort: 2 },
    { type: PermissionType.MENU, slug: 'materials', name: 'Materials', parentId: 0, icon: 'files', url: '/admin/materials', api: JSON.stringify([{ method: 'GET', url: '/api/admin/materials' }]), sort: 3 },
    { type: PermissionType.MENU, slug: 'material-categories', name: 'Material Categories', parentId: 0, icon: 'tags', url: '/admin/material-categories', api: JSON.stringify([{ method: 'GET', url: '/api/admin/material-categories' }]), sort: 4 },
    { type: PermissionType.MENU, slug: 'inquiries', name: 'Inquiries', parentId: 0, icon: 'inbox', url: '/admin/inquiries', api: JSON.stringify([{ method: 'GET', url: '/api/admin/inquiries' }]), sort: 5 },
    { type: PermissionType.MENU, slug: 'sensitive-words', name: 'Sensitive Words', parentId: 0, icon: 'shield', url: '/admin/sensitive-words', api: JSON.stringify([{ method: 'GET', url: '/api/admin/sensitive-words' }]), sort: 6 },
    { type: PermissionType.MENU, slug: 'settings', name: 'Settings', parentId: 0, icon: 'settings', url: '/admin/settings', api: '', sort: 7 },
  ]

  const [adminRole] = await db
    .insert(roles)
    .values({
      name: 'admin',
      description: 'Full system access',
      status: 1,
    })
    .onConflictDoUpdate({
      target: roles.name,
      set: {
        description: 'Full system access',
        status: 1,
        updatedAt: new Date(),
      },
    })
    .returning()

  const insertedPermissions = await db
    .insert(permissions)
    .values(defaultPermissions)
    .onConflictDoUpdate({
      target: permissions.slug,
      set: {
        updatedAt: new Date(),
      },
    })
    .returning()

  if (insertedPermissions.length) {
    await db
      .insert(rolePermissions)
      .values(insertedPermissions.map(permission => ({
        roleId: adminRole.id,
        permissionId: permission.id,
      })))
      .onConflictDoNothing()
  }

  await db
    .insert(users)
    .values({
      username: 'admin',
      email: ADMIN_EMAIL,
      nickname: 'Admin',
      password: await hash(ADMIN_PASSWORD, 10),
      roleId: adminRole.id,
      status: 1,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        username: 'admin',
        nickname: 'Admin',
        password: await hash(ADMIN_PASSWORD, 10),
        roleId: adminRole.id,
        status: 1,
        updatedAt: new Date(),
      },
    })

  await db
    .insert(sensitiveWords)
    .values(defaultSensitiveWords)
    .onConflictDoNothing()

  await db
    .insert(materialCategories)
    .values([
      { name: 'Marketplace', slug: 'marketplace', description: 'Marketplace launch and catalog operations.', status: 1 },
      { name: 'Logistics', slug: 'logistics', description: 'Warehouse, shipping, and fulfillment handoff materials.', status: 1 },
      { name: 'Compliance', slug: 'compliance', description: 'Compliance, document, and risk review resources.', status: 1 },
      { name: 'Playbook', slug: 'playbook', description: 'Reusable operating playbooks and checklists.', status: 1 },
    ])
    .onConflictDoNothing()

  await db
    .insert(uploadedMaterials)
    .values([
      {
        title: 'Amazon FBA launch checklist for private-label sellers',
        summary: 'A practical review pack for product data, inbound shipping files, carton labels, and approval notes before FBA inventory is released.',
        category: 'marketplace',
        content: [
          'Use this checklist before a new private-label catalog goes live on Amazon FBA. Confirm that product attributes, image requirements, compliance labels, and carton-level shipping data are aligned before the inbound plan is handed to the warehouse.',
          'Operations teams should verify SKU naming, HS code references, product dimensions, packaging notes, and any certificate expiry dates. The goal is to reduce repeated questions between marketplace operators, suppliers, and freight partners.',
          'Publish this page for teams that need a shared reference before weekly launch reviews.',
        ].join('\n\n'),
        fileName: 'amazon-fba-launch-checklist.pdf',
        fileSize: 842000,
        fileKey: 'test/materials/seed/amazon-fba-launch-checklist.pdf',
        fileContentType: 'application/pdf',
        status: UploadedMaterialStatus.PUBLISHED,
      },
      {
        title: 'EU cross-border compliance handoff guide',
        summary: 'A handoff guide for VAT records, importer details, product safety references, and marketplace documentation used by EU operations teams.',
        category: 'compliance',
        content: [
          'This guide helps sellers prepare EU launch documentation before inventory moves into the region. It focuses on the records that usually slow down account review, warehouse acceptance, and channel activation.',
          'Keep VAT registration details, importer contacts, product safety files, declaration references, and packaging requirements in one review packet. When documents expire or change, update the admin record and republish the resource.',
        ].join('\n\n'),
        fileName: 'eu-compliance-handoff.pdf',
        fileSize: 615000,
        fileKey: 'test/materials/seed/eu-compliance-handoff.pdf',
        fileContentType: 'application/pdf',
        status: UploadedMaterialStatus.PUBLISHED,
      },
      {
        title: '3PL receiving notes for high-volume promotions',
        summary: 'A logistics playbook for promotion inventory, appointment windows, pallet rules, exception notes, and carrier communication.',
        category: 'logistics',
        content: [
          'High-volume promotions create pressure across receiving, inspection, relabeling, and outbound dispatch. This playbook gives operations teams a shared reference before goods arrive at the 3PL.',
          'Document promotion dates, expected units, carrier references, pallet rules, photo requirements, and exception contacts. Share the final attachment with warehouse teams before appointment confirmation.',
        ].join('\n\n'),
        fileName: '3pl-promotion-receiving-notes.pdf',
        fileSize: 508000,
        fileKey: 'test/materials/seed/3pl-promotion-receiving-notes.pdf',
        fileContentType: 'application/pdf',
        status: UploadedMaterialStatus.PUBLISHED,
      },
    ])
    .onConflictDoNothing()
}

seed()
  .then(() => {
    console.log(`Database seeded. Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Database seed failed', error)
    process.exit(1)
  })

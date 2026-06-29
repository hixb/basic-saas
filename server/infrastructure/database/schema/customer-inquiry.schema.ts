import { boolean, index, jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export type CustomerInquiry = typeof customerInquiries.$inferSelect
export type NewCustomerInquiry = typeof customerInquiries.$inferInsert

/**
 * Customer inquiry status constants.
 */
export const CustomerInquiryStatus = {
  NEW: 'new',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

/**
 * Front website inquiry submissions.
 */
export const customerInquiries = pgTable('customer_inquiries', {
  id: serial('id').primaryKey(),
  contactName: varchar('contact_name', { length: 120 }).notNull(),
  companyName: varchar('company_name', { length: 160 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 60 }).notNull(),
  description: text('description').notNull(),
  ip: varchar('ip', { length: 45 }),
  countryCode: varchar('country_code', { length: 10 }),
  region: varchar('region', { length: 100 }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  emoji: varchar('emoji', { length: 10 }).notNull().default('🏳️'),
  status: varchar('status', { length: 30 }).notNull().default(CustomerInquiryStatus.NEW),
  sensitiveHit: boolean('sensitive_hit').notNull().default(false),
  matchedSensitiveWords: jsonb('matched_sensitive_words').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, table => ([
  index('customer_inquiries_email_idx').on(table.email),
  index('customer_inquiries_country_idx').on(table.country),
  index('customer_inquiries_status_idx').on(table.status),
  index('customer_inquiries_sensitive_hit_idx').on(table.sensitiveHit),
  index('customer_inquiries_created_at_idx').on(table.createdAt),
]))

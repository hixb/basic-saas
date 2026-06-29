import { and, count, desc, eq, gte, isNotNull, sql } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { customerInquiries, CustomerInquiryStatus } from '~/server/infrastructure/database/schema/customer-inquiry.schema'
import { materialCategories, MaterialCategoryStatus } from '~/server/infrastructure/database/schema/material-category.schema'
import { sensitiveWords, SensitiveWordStatus } from '~/server/infrastructure/database/schema/sensitive-word.schema'
import { uploadedMaterials, UploadedMaterialStatus } from '~/server/infrastructure/database/schema/uploaded-material.schema'
import { users } from '~/server/infrastructure/database/schema/user.schema'

export interface DashboardMetric {
  key: string
  value: number
}

export interface DashboardTrendPoint {
  date: string
  inquiries: number
  sensitiveHits: number
}

export interface DashboardCountryPoint {
  country: string
  emoji: string
  count: number
}

export interface DashboardRecentInquiry {
  id: number
  contactName: string
  companyName: string
  email: string
  country: string | null
  city: string | null
  emoji: string
  sensitiveHit: boolean
  createdAt: string
}

export interface DashboardSummary {
  metrics: {
    totalInquiries: number
    newInquiries: number
    sensitiveHits: number
    totalMaterials: number
    publishedMaterials: number
    activeCategories: number
    activeSensitiveWords: number
    activeUsers: number
  }
  inquiryTrend: DashboardTrendPoint[]
  materialStatuses: DashboardMetric[]
  sensitiveSeverities: DashboardMetric[]
  countryDistribution: DashboardCountryPoint[]
  recentInquiries: DashboardRecentInquiry[]
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

function getIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function normalizeCount(value: unknown) {
  return Number(value ?? 0)
}

/**
 * Builds dashboard analytics from persisted admin data.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = new Date()
  const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6))

  const [
    totalInquiries,
    newInquiries,
    sensitiveHits,
    totalMaterials,
    publishedMaterials,
    activeCategories,
    activeSensitiveWords,
    activeUsers,
    inquiryTrendRows,
    materialStatusRows,
    sensitiveSeverityRows,
    countryRows,
    recentInquiryRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(customerInquiries),
    db.select({ value: count() }).from(customerInquiries).where(eq(customerInquiries.status, CustomerInquiryStatus.NEW)),
    db.select({ value: count() }).from(customerInquiries).where(eq(customerInquiries.sensitiveHit, true)),
    db.select({ value: count() }).from(uploadedMaterials),
    db.select({ value: count() }).from(uploadedMaterials).where(eq(uploadedMaterials.status, UploadedMaterialStatus.PUBLISHED)),
    db.select({ value: count() }).from(materialCategories).where(eq(materialCategories.status, MaterialCategoryStatus.ACTIVE)),
    db.select({ value: count() }).from(sensitiveWords).where(eq(sensitiveWords.status, SensitiveWordStatus.ACTIVE)),
    db.select({ value: count() }).from(users).where(eq(users.status, 1)),
    db
      .select({
        date: sql<string>`to_char(${customerInquiries.createdAt}, 'YYYY-MM-DD')`,
        inquiries: count(),
        sensitiveHits: sql<number>`count(*) filter (where ${customerInquiries.sensitiveHit} = true)`,
      })
      .from(customerInquiries)
      .where(gte(customerInquiries.createdAt, startDate))
      .groupBy(sql`to_char(${customerInquiries.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${customerInquiries.createdAt}, 'YYYY-MM-DD')`),
    db
      .select({
        key: uploadedMaterials.status,
        value: count(),
      })
      .from(uploadedMaterials)
      .groupBy(uploadedMaterials.status),
    db
      .select({
        key: sensitiveWords.severity,
        value: count(),
      })
      .from(sensitiveWords)
      .where(eq(sensitiveWords.status, SensitiveWordStatus.ACTIVE))
      .groupBy(sensitiveWords.severity),
    db
      .select({
        country: customerInquiries.country,
        emoji: customerInquiries.emoji,
        value: count(),
      })
      .from(customerInquiries)
      .where(and(isNotNull(customerInquiries.country), isNotNull(customerInquiries.countryCode)))
      .groupBy(customerInquiries.country, customerInquiries.emoji)
      .orderBy(desc(count()))
      .limit(5),
    db
      .select({
        id: customerInquiries.id,
        contactName: customerInquiries.contactName,
        companyName: customerInquiries.companyName,
        email: customerInquiries.email,
        country: customerInquiries.country,
        city: customerInquiries.city,
        emoji: customerInquiries.emoji,
        sensitiveHit: customerInquiries.sensitiveHit,
        createdAt: customerInquiries.createdAt,
      })
      .from(customerInquiries)
      .orderBy(desc(customerInquiries.createdAt))
      .limit(6),
  ])

  const trendByDate = new Map(inquiryTrendRows.map(row => [row.date, {
    inquiries: normalizeCount(row.inquiries),
    sensitiveHits: normalizeCount(row.sensitiveHits),
  }]))

  const inquiryTrend = Array.from({ length: 7 }).map((_, index) => {
    const date = getIsoDate(new Date(startDate.getTime() + index * DAY_IN_MS))
    const row = trendByDate.get(date)

    return {
      date,
      inquiries: row?.inquiries ?? 0,
      sensitiveHits: row?.sensitiveHits ?? 0,
    }
  })

  return {
    metrics: {
      totalInquiries: totalInquiries[0]?.value ?? 0,
      newInquiries: newInquiries[0]?.value ?? 0,
      sensitiveHits: sensitiveHits[0]?.value ?? 0,
      totalMaterials: totalMaterials[0]?.value ?? 0,
      publishedMaterials: publishedMaterials[0]?.value ?? 0,
      activeCategories: activeCategories[0]?.value ?? 0,
      activeSensitiveWords: activeSensitiveWords[0]?.value ?? 0,
      activeUsers: activeUsers[0]?.value ?? 0,
    },
    inquiryTrend,
    materialStatuses: materialStatusRows.map(row => ({
      key: row.key,
      value: row.value,
    })),
    sensitiveSeverities: sensitiveSeverityRows.map(row => ({
      key: row.key,
      value: row.value,
    })),
    countryDistribution: countryRows.map(row => ({
      country: row.country ?? 'Unknown',
      emoji: row.emoji,
      count: row.value,
    })),
    recentInquiries: recentInquiryRows.map(row => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  }
}

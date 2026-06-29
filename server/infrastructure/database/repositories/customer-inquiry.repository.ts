import type { CustomerInquiry, NewCustomerInquiry } from '~/server/infrastructure/database/schema/customer-inquiry.schema'
import { asc, count, desc, eq, ilike, or } from 'drizzle-orm'
import { db } from '~/server/infrastructure/database'
import { customerInquiries } from '~/server/infrastructure/database/schema/customer-inquiry.schema'

/**
 * Repository for customer inquiry data access operations.
 */
export class CustomerInquiryRepository {
  /**
   * Find inquiries with pagination.
   */
  async findPaginated(params: {
    page: number
    pageSize: number
    keyword?: string
    status?: string
    sortDirection?: 'ascending' | 'descending'
  }): Promise<{ data: CustomerInquiry[], total: number }> {
    const where = params.keyword
      ? or(
          ilike(customerInquiries.contactName, `%${params.keyword}%`),
          ilike(customerInquiries.companyName, `%${params.keyword}%`),
          ilike(customerInquiries.email, `%${params.keyword}%`),
        )
      : undefined

    const orderBy = params.sortDirection === 'ascending'
      ? asc(customerInquiries.createdAt)
      : desc(customerInquiries.createdAt)

    const data = await db
      .select()
      .from(customerInquiries)
      .where(where)
      .orderBy(orderBy)
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize)

    const totalResult = await db
      .select({ value: count() })
      .from(customerInquiries)
      .where(where)

    return { data, total: totalResult[0]?.value ?? 0 }
  }

  /**
   * Create inquiry record.
   */
  async create(data: NewCustomerInquiry): Promise<CustomerInquiry> {
    const result = await db.insert(customerInquiries).values(data).returning()
    return result[0]
  }

  /**
   * Update inquiry geo snapshot fields.
   */
  async updateGeo(id: number, data: Partial<Pick<NewCustomerInquiry, 'ip' | 'countryCode' | 'region' | 'country' | 'city' | 'emoji'>>): Promise<void> {
    await db
      .update(customerInquiries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customerInquiries.id, id))
  }
}

import { z } from 'zod'

/**
 * Public inquiry submission schema.
 */
export const createInquirySchema = z.object({
  contactName: z.string().min(2, 'Contact name is required').max(120),
  companyName: z.string().min(2, 'Company name is required').max(160),
  email: z.string().email('Invalid email format').max(255),
  phone: z.string().min(5, 'Phone number is required').max(60),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
})

/**
 * Admin material content schema.
 */
export const createMaterialSchema = z.object({
  title: z.string().min(2, 'Title is required').max(180),
  summary: z.string().min(10, 'Summary must be at least 10 characters').max(500),
  category: z.string().min(2, 'Category is required').max(80),
  content: z.string().min(40, 'Content must be at least 40 characters'),
  coverKey: z.string().max(500).optional().or(z.literal('')),
  fileName: z.string().max(255).optional(),
  fileSize: z.coerce.number().int().min(0).max(50_000_000).default(0),
  fileKey: z.string().max(500).optional().or(z.literal('')),
  fileContentType: z.string().max(120).optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
})

/**
 * Admin material category schema.
 */
export const materialCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(120),
  slug: z.string().min(2, 'Category slug is required').max(80).regex(/^[a-z0-9-]+$/, 'Slug must contain lowercase letters, numbers, and hyphens only'),
  description: z.string().max(500).optional(),
  status: z.number().int().min(1).max(2).default(1),
})

/**
 * Sensitive word mutation schema.
 */
export const sensitiveWordSchema = z.object({
  word: z.string().min(2, 'Sensitive word is required').max(120),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  note: z.string().max(500).optional(),
  status: z.number().int().min(1).max(2).default(1),
})

export type CreateInquiryInput = z.infer<typeof createInquirySchema>
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>
export type MaterialCategoryInput = z.infer<typeof materialCategorySchema>
export type SensitiveWordInput = z.infer<typeof sensitiveWordSchema>

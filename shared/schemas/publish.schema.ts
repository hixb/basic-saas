import { z } from 'zod'

/**
 * Social publish request schema.
 */
export const publishRequestSchema = z.object({
  postId: z.coerce.number().int().positive('Post ID is required'),
  platforms: z.array(z.enum(['facebook', 'youtube'])).optional(),
})

/**
 * Social publish request input.
 */
export type PublishRequestInput = z.infer<typeof publishRequestSchema>

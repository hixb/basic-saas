import type { SensitiveWord } from '~/server/infrastructure/database/schema/sensitive-word.schema'

/**
 * Finds active sensitive words contained in submitted content.
 */
export function findSensitiveWordMatches(content: string, words: SensitiveWord[]): string[] {
  const normalizedContent = content.toLowerCase()
  const matches = words
    .filter(word => normalizedContent.includes(word.word.toLowerCase()))
    .map(word => word.word)

  return Array.from(new Set(matches))
}

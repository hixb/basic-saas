import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS class names with support for conditional classes.
 * @param inputs - The class names to merge (can be strings, objects, or arrays)
 * @returns The merged class names
 * @example
 * cn('btn', { 'btn-primary': isPrimary }, ['mt-4', 'mb-2'])
 * // => 'btn btn-primary mt-4 mb-2' (if isPrimary is true)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import type { z } from 'zod'
import type { ValidationErrorData, ValidationErrorReason } from '~/shared/types/api.type'

export function getIssueField(issue: z.core.$ZodIssue) {
  const field = issue.path[0]
  return typeof field === 'string' ? field : undefined
}

function getIssueNumber(issue: z.core.$ZodIssue, key: 'minimum' | 'maximum') {
  const issueWithLimits = issue as z.core.$ZodIssue & Partial<Record<'minimum' | 'maximum', number>>
  const value = issueWithLimits[key]

  if (typeof value === 'number')
    return value

  return undefined
}

export function getValidationReason(issue: z.core.$ZodIssue): ValidationErrorReason {
  if (issue.code === 'invalid_type')
    return 'required'

  if (issue.code === 'too_small')
    return 'too_small'

  if (issue.code === 'too_big')
    return 'too_big'

  if (issue.code === 'invalid_format' && 'format' in issue) {
    if (issue.format === 'email')
      return 'invalid_email'

    if (issue.format === 'url')
      return 'invalid_url'
  }

  return 'unknown'
}

export function mapValidationIssue(issue: z.core.$ZodIssue): ValidationErrorData {
  return {
    reason: getValidationReason(issue),
    field: getIssueField(issue),
    min: getIssueNumber(issue, 'minimum'),
    max: getIssueNumber(issue, 'maximum'),
  }
}

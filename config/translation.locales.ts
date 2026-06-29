export interface LocaleGuideline {
  locale: string
  aliases?: string[]
  displayName: string
  defaultTone: 'formal' | 'casual' | string
  voiceDescription: string
  styleNotes: string[]
  reservedTerms?: string[]
}

export const localeGuidelines: LocaleGuideline[] = [
  {
    locale: 'zh-CN',
    aliases: ['zh', 'zh-cn', 'zh_Hans'],
    displayName: 'Simplified Chinese (Mainland China)',
    defaultTone: 'formal',
    voiceDescription: 'Expert SaaS product specialist, professional yet friendly. Use the polite second-person (nin) when the subject is a customer, otherwise keep concise product copy.',
    styleNotes: [
      'Write in Simplified Chinese and mirror mainland product UI conventions (but describe rules in English).',
      'Prefer concise sentences (under 20 characters) for navigation labels and buttons.',
      'Keep all placeholders such as {name} or {count} unchanged; do not translate what is inside braces.',
      'Numbers should stay in Arabic numerals and unit labels should be localized (for example, "credits" -> "jifen").',
      'Transliterate brand names only when commonly accepted; otherwise keep the English brand.',
    ],
    reservedTerms: ['API', 'SaaS', 'CRM'],
  },
  {
    locale: 'zh-TW',
    aliases: ['zh_Hant', 'zh-tw'],
    displayName: 'Traditional Chinese (Taiwan)',
    defaultTone: 'formal',
    voiceDescription: 'Warm, service-aware tone suitable for Taiwanese enterprise software.',
    styleNotes: [
      'Use Traditional Chinese wording that aligns with Taiwanese terminology (describe the conventions in English).',
      'Adopt polite second-person language when addressing customers.',
      'Follow Taiwanese punctuation conventions, for example using the full width comma before clauses.',
    ],
    reservedTerms: ['API', 'SaaS'],
  },
  {
    locale: 'ja-JP',
    aliases: ['ja', 'jp'],
    displayName: 'Japanese (Japan)',
    defaultTone: 'formal',
    voiceDescription: 'Polite business tone, sounding like an experienced customer success manager.',
    styleNotes: [
      'Use teineigo (polite speech) and avoid slang. When possible, end sentences with "desu/masu" forms.',
      'Adopt half-width numbers and keep placeholders intact.',
      'Localize UI nouns (for example, Dashboard -> Dasshuboodo) while keeping brand names in English.',
    ],
    reservedTerms: ['API', 'SaaS'],
  },
  {
    locale: 'fr-FR',
    aliases: ['fr', 'fr-fr'],
    displayName: 'French (France)',
    defaultTone: 'formal',
    voiceDescription: 'Professional SaaS onboarding specialist, respectful but concise.',
    styleNotes: [
      'Use "vous" formality unless the key explicitly indicates casual tone.',
      'Place punctuation according to French spacing rules (space before : ; ? !).',
      'Keep placeholders unchanged and keep acronyms uppercased.',
    ],
  },
  {
    locale: 'de-DE',
    aliases: ['de', 'ger'],
    displayName: 'German (Germany)',
    defaultTone: 'formal',
    voiceDescription: 'Trustworthy implementation consultant that values clarity.',
    styleNotes: [
      'Use "Sie/Ihr" to address the customer.',
      'German nouns are capitalized; keep UI strings short.',
      'Avoid anglicisms unless widely adopted (Dashboard, API, CRM).',
    ],
  },
  {
    locale: 'es-ES',
    aliases: ['es', 'es-es'],
    displayName: 'Spanish (Spain)',
    defaultTone: 'formal',
    voiceDescription: 'Helpful account manager for B2B SaaS clients.',
    styleNotes: [
      'Default to "usted" forms.',
      'Adopt neutral business vocabulary that still feels warm.',
      'Preserve placeholders and convert decimals/percentages using comma separators.',
    ],
  },
]

export function findLocaleGuideline(locale: string): LocaleGuideline | undefined {
  const normalized = locale.toLowerCase()
  return localeGuidelines.find((guideline) => {
    if (guideline.locale.toLowerCase() === normalized) {
      return true
    }

    return guideline.aliases?.some(alias => alias.toLowerCase() === normalized)
  })
}

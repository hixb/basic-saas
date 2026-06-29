import type { LocaleGuideline } from '~/config/translation.locales'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { findLocaleGuideline } from '~/config/translation.locales'

type ProviderChoice = 'mock' | 'openai' | 'gemini' | 'auto'

interface CliOptions {
  baseLocale: string
  locales: string[]
  provider: ProviderChoice
  model?: string
  contextFilePaths: string[]
  contexts: string[]
  promptOverrides: string[]
  style?: string
  dryRun: boolean
  force: boolean
  checkOnly: boolean
  maxBatchSize: number
}

interface TranslationJob {
  id: string
  locale: string
  relativePath: string
  namespace: string
  keyPath: string
  sourceText: string
  existingText?: string
  placeholders: string[]
  displayPath: string
  sourceHash: string
  fileKey: string
}

interface PromptMessage {
  role: 'system' | 'user'
  content: string
}

interface TranslateRequest {
  locale: string
  jobs: TranslationJob[]
  messages: PromptMessage[]
}

interface Translator {
  translate: (request: TranslateRequest) => Promise<Record<string, string>>
}

interface TargetFileRecord {
  locale: string
  relativePath: string
  fullPath: string
  data: any
  dirty: boolean
}

interface CacheEntry {
  sourceHash: string
  updatedAt: string
}

interface TranslationCache {
  locale: string
  path: string
  entries: Record<string, CacheEntry>
  dirty: boolean
}

interface PendingCachePrime {
  locale: string
  cacheKey: string
  hash: string
}

const DEFAULT_BATCH_SIZE = 10
const MESSAGES_DIR = join(process.cwd(), 'messages')
const CACHE_DIR = join(MESSAGES_DIR, '.translation-cache')

loadEnvFile()

async function main() {
  const options = parseCliArgs(process.argv.slice(2))
  applyEnvDefaults(options)

  if (options.locales.length === 0) {
    options.locales = ['all']
  }

  const baseDir = join(MESSAGES_DIR, options.baseLocale)
  if (!existsSync(baseDir)) {
    console.error(`ERROR: Base locale directory not found: ${baseDir}`)
    process.exit(1)
    return
  }

  const availableLocales = await listLocales()
  const targetLocales = resolveTargetLocales(options, availableLocales).filter(locale => locale !== options.baseLocale)

  if (targetLocales.length === 0) {
    console.log('INFO: No target locales selected. Nothing to do.')
    return
  }

  const baseFiles = await listJsonFiles(baseDir)
  if (baseFiles.length === 0) {
    console.error(`ERROR: No JSON files found under ${baseDir}`)
    process.exit(1)
    return
  }

  const projectContext = await buildProjectContext(options)
  const translator = await createTranslator(options)

  const targetFiles = new Map<string, TargetFileRecord>()
  const localeCaches = new Map<string, TranslationCache>()
  const pendingCachePrimes: PendingCachePrime[] = []

  for (const locale of targetLocales) {
    const cache = await loadTranslationCache(locale)
    localeCaches.set(locale, cache)
  }

  const jobs: TranslationJob[] = []

  for (const relativePath of baseFiles) {
    const baseFullPath = join(baseDir, relativePath)
    const baseData = await readJson(baseFullPath)
    const baseFlat = flattenTranslations(baseData)
    const namespace = relativePath.replace(/\.json$/i, '').replace(/\//g, '.')

    for (const locale of targetLocales) {
      const fileKey = buildFileKey(locale, relativePath)
      const record = await ensureTargetFileRecord(locale, relativePath, targetFiles)
      const targetFlat = flattenTranslations(record.data)
      const cache = localeCaches.get(locale)!

      for (const [keyPath, sourceText] of Object.entries(baseFlat)) {
        if (typeof sourceText !== 'string') {
          continue
        }

        const sourceHash = hashString(sourceText)
        const currentValue = targetFlat[keyPath]
        const cacheKey = buildCacheKey(relativePath, keyPath)
        const cacheEntry = cache.entries[cacheKey]

        const needsTranslation = shouldTranslate({
          force: options.force,
          sourceText,
          targetText: currentValue,
          cacheEntry,
        })

        if (needsTranslation) {
          const jobId = buildJobId(locale, relativePath, keyPath)
          jobs.push({
            id: jobId,
            locale,
            relativePath,
            namespace,
            keyPath,
            sourceText,
            existingText: currentValue,
            placeholders: extractPlaceholders(sourceText),
            displayPath: `${namespace}.${keyPath}`,
            sourceHash,
            fileKey,
          })
        }
        else if (!cacheEntry && currentValue) {
          pendingCachePrimes.push({
            locale,
            cacheKey,
            hash: sourceHash,
          })
        }
      }
    }
  }

  if (jobs.length === 0) {
    if (options.checkOnly) {
      console.log('OK: All locales are in sync with the base language.')
    }
    else {
      console.log('OK: Nothing to translate. All target locales look up to date.')
      if (pendingCachePrimes.length > 0 && !options.dryRun) {
        applyCachePrimes(pendingCachePrimes, localeCaches)
        await persistCaches(localeCaches)
      }
    }
    return
  }

  if (options.checkOnly) {
    console.error('ERROR: Missing or outdated translations detected:')
    for (const job of jobs) {
      console.error(`  - ${job.locale}: ${job.displayPath}`)
    }
    process.exit(1)
    return
  }

  if (options.dryRun) {
    console.log('DRY-RUN: The following entries would be translated:')
    for (const job of jobs) {
      const currentText = job.existingText ? ` (current: ${job.existingText})` : ''
      console.log(`  - ${job.locale}: ${job.displayPath}${currentText}`)
    }
    console.log(`Total pending translations: ${jobs.length}`)
    return
  }

  applyCachePrimes(pendingCachePrimes, localeCaches)

  const stats = {
    total: jobs.length,
    translated: 0,
    skipped: 0,
  }

  for (const locale of targetLocales) {
    const localeJobs = jobs.filter(job => job.locale === locale)
    if (localeJobs.length === 0) {
      continue
    }

    const guideline = findLocaleGuideline(locale)

    for (const chunk of chunkJobs(localeJobs, options.maxBatchSize)) {
      const messages = buildPromptMessages({
        locale,
        baseLocale: options.baseLocale,
        projectContext,
        guideline,
        jobs: chunk,
        overrides: options.promptOverrides,
        styleOverride: options.style,
      })

      try {
        const translations = await translator.translate({
          locale,
          jobs: chunk,
          messages,
        })

        for (const job of chunk) {
          const translated = translations[job.id]
          if (!translated) {
            console.warn(`WARN: Missing translation for ${job.displayPath}`)
            stats.skipped += 1
            continue
          }

          const trimmed = translated.trim()
          if (!trimmed) {
            console.warn(`WARN: Empty translation returned for ${job.displayPath}`)
            stats.skipped += 1
            continue
          }

          const record = targetFiles.get(job.fileKey)
          if (!record) {
            console.warn(`WARN: Target file record missing for ${job.displayPath}`)
            stats.skipped += 1
            continue
          }

          applyTranslation(record.data, job.keyPath, trimmed)
          record.dirty = true

          const cache = localeCaches.get(job.locale)
          if (cache) {
            cache.entries[buildCacheKey(job.relativePath, job.keyPath)] = {
              sourceHash: job.sourceHash,
              updatedAt: new Date().toISOString(),
            }
            cache.dirty = true
          }

          stats.translated += 1
          console.log(`OK: ${job.locale} - ${job.displayPath}`)
        }
      }
      catch (error) {
        console.error(`ERROR: Failed to translate chunk for ${locale}:`, error)
        process.exit(1)
      }
    }
  }

  await persistTargetFiles(targetFiles)
  await persistCaches(localeCaches)

  console.log(`\nDone. ${stats.translated}/${stats.total} entries translated. ${stats.skipped} skipped.`)
}

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    baseLocale: 'en',
    locales: [],
    provider: 'auto',
    model: undefined,
    contextFilePaths: [],
    contexts: [],
    promptOverrides: [],
    style: undefined,
    dryRun: false,
    force: false,
    checkOnly: false,
    maxBatchSize: DEFAULT_BATCH_SIZE,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i]
    if (raw === '--') {
      continue
    }
    if (!raw.startsWith('--')) {
      options.locales.push(raw)
      continue
    }

    const [flag, valueFromEquals] = raw.split('=')
    const key = flag.replace(/^--/, '')
    const nextValue = valueFromEquals ?? argv[i + 1]

    switch (key) {
      case 'help':
        printHelp()
        process.exit(0)
        break
      case 'base':
      case 'base-locale':
        if (!nextValue) {
          throw new Error('--base requires a value')
        }
        options.baseLocale = nextValue
        if (!valueFromEquals)
          i += 1
        break
      case 'locale':
      case 'lang':
      case 'locales':
        if (!nextValue) {
          throw new Error('--locale requires a value')
        }
        options.locales.push(...nextValue.split(',').map(token => token.trim()).filter(Boolean))
        if (!valueFromEquals)
          i += 1
        break
      case 'provider':
        if (!nextValue) {
          throw new Error('--provider requires a value')
        }
        if (!['mock', 'openai', 'gemini', 'auto'].includes(nextValue)) {
          throw new Error(`Unsupported provider: ${nextValue}`)
        }
        options.provider = nextValue as CliOptions['provider']
        if (!valueFromEquals)
          i += 1
        break
      case 'model':
        if (!nextValue) {
          throw new Error('--model requires a value')
        }
        options.model = nextValue
        if (!valueFromEquals)
          i += 1
        break
      case 'context-file':
        if (!nextValue) {
          throw new Error('--context-file requires a path')
        }
        options.contextFilePaths.push(nextValue)
        if (!valueFromEquals)
          i += 1
        break
      case 'context':
        if (!nextValue) {
          throw new Error('--context requires a value')
        }
        options.contexts.push(nextValue)
        if (!valueFromEquals)
          i += 1
        break
      case 'prompt-overrides':
        if (!nextValue) {
          throw new Error('--prompt-overrides requires a value')
        }
        options.promptOverrides.push(nextValue)
        if (!valueFromEquals)
          i += 1
        break
      case 'style':
        if (!nextValue) {
          throw new Error('--style requires a value')
        }
        options.style = nextValue
        if (!valueFromEquals)
          i += 1
        break
      case 'dry-run':
        options.dryRun = true
        break
      case 'force':
        options.force = true
        break
      case 'check':
      case 'check-only':
        options.checkOnly = true
        break
      case 'max-batch-size':
        if (!nextValue) {
          throw new Error('--max-batch-size requires a value')
        }
        options.maxBatchSize = Number.parseInt(nextValue, 10)
        if (Number.isNaN(options.maxBatchSize) || options.maxBatchSize <= 0) {
          throw new Error('--max-batch-size must be a positive integer')
        }
        if (!valueFromEquals)
          i += 1
        break
      default:
        throw new Error(`Unknown flag: ${flag}`)
    }
  }

  return options
}

function applyEnvDefaults(options: CliOptions) {
  if (options.provider === 'auto') {
    const envProvider = normalizeProvider(process.env.TRANSLATION_PROVIDER)
    if (envProvider) {
      options.provider = envProvider
    }
  }

  if (options.locales.length === 0 && process.env.TRANSLATION_LOCALES) {
    options.locales = splitList(process.env.TRANSLATION_LOCALES)
  }

  if (!options.style && process.env.TRANSLATION_STYLE) {
    options.style = process.env.TRANSLATION_STYLE
  }

  if (options.promptOverrides.length === 0 && process.env.TRANSLATION_PROMPT_OVERRIDES) {
    options.promptOverrides = splitList(process.env.TRANSLATION_PROMPT_OVERRIDES, '|')
  }

  if (options.contexts.length === 0 && process.env.TRANSLATION_CONTEXT) {
    options.contexts = [process.env.TRANSLATION_CONTEXT]
  }

  if (options.contextFilePaths.length === 0 && process.env.TRANSLATION_CONTEXT_FILES) {
    options.contextFilePaths = splitList(process.env.TRANSLATION_CONTEXT_FILES)
  }

  if (!options.model) {
    const globalModel = process.env.TRANSLATION_MODEL
    if (globalModel) {
      options.model = globalModel
    }
    else if (options.provider === 'openai' && process.env.OPENAI_TRANSLATION_MODEL) {
      options.model = process.env.OPENAI_TRANSLATION_MODEL
    }
    else if (options.provider === 'gemini' && process.env.GEMINI_TRANSLATION_MODEL) {
      options.model = process.env.GEMINI_TRANSLATION_MODEL
    }
  }
}

function printHelp() {
  console.log(`Usage: pnpm tsx scripts/auto-translate.ts [options]

Options:
  --base <locale>              Base locale directory (default: en)
  --locale <lc>                Target locale (repeatable, accepts comma separated list). Use "all" to translate every locale.
  --provider <name>            mock | openai | gemini | auto (default: auto - pick by available API keys)
  --model <name>               Provider specific model name (e.g. gpt-4o-mini, gemini-1.5-pro)
  --context-file <path>        Extra context file to include in prompts (repeatable)
  --context <text>             Free-form context snippet (repeatable)
  --prompt-overrides <text>    Additional prompt instructions (repeatable)
  --style <text>               Override the default tone instruction for the locale
  --dry-run                    List pending translations without calling any provider
  --force                      Re-translate every key even if cached
  --check-only                 Fail if any translations are missing or stale
  --max-batch-size <N>         How many keys to send per prompt (default: 10)
  --help                       Show this message
`)
}

async function listLocales(): Promise<string[]> {
  const entries = await readdir(MESSAGES_DIR, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
}

function resolveTargetLocales(options: CliOptions, availableLocales: string[]): string[] {
  const requested = options.locales.length === 0 ? ['all'] : options.locales
  const unique = new Set<string>()

  for (const token of requested) {
    if (token === 'all') {
      availableLocales.forEach(locale => unique.add(locale))
    }
    else {
      unique.add(token)
    }
  }

  return Array.from(unique)
}

async function listJsonFiles(rootDir: string, relativeDir = ''): Promise<string[]> {
  const entries = await readdir(join(rootDir, relativeDir), { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = await listJsonFiles(rootDir, join(relativeDir, entry.name))
      files.push(...nested)
    }
    else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(join(relativeDir, entry.name))
    }
  }

  return files
}

async function readJson(path: string) {
  const raw = await readFile(path, 'utf-8')
  return JSON.parse(raw)
}

function flattenTranslations(input: any, prefix = '', target: Record<string, string> = {}): Record<string, string> {
  if (!input || typeof input !== 'object') {
    return target
  }

  for (const [key, value] of Object.entries(input)) {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      target[nextKey] = value
    }
    else if (value && typeof value === 'object') {
      flattenTranslations(value, nextKey, target)
    }
  }

  return target
}

function extractPlaceholders(value: string): string[] {
  const matches = value.matchAll(/\{([\w.-]+)\}/g)
  return Array.from(matches, match => match[1])
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function buildJobId(locale: string, relativePath: string, keyPath: string): string {
  return `${locale}::${relativePath}::${keyPath}`
}

function buildFileKey(locale: string, relativePath: string): string {
  return `${locale}::${relativePath}`
}

function buildCacheKey(relativePath: string, keyPath: string): string {
  return `${relativePath}::${keyPath}`
}

async function ensureTargetFileRecord(locale: string, relativePath: string, cache: Map<string, TargetFileRecord>) {
  const fileKey = buildFileKey(locale, relativePath)
  if (cache.has(fileKey)) {
    return cache.get(fileKey)!
  }

  const localeDir = join(MESSAGES_DIR, locale)
  await mkdir(localeDir, { recursive: true })
  const fullPath = join(localeDir, relativePath)
  let data: any = {}

  if (existsSync(fullPath)) {
    const raw = await readFile(fullPath, 'utf-8')
    try {
      data = JSON.parse(raw)
    }
    catch {
      console.warn(`WARN: Could not parse JSON at ${fullPath}. Starting with an empty object.`)
    }
  }

  const record: TargetFileRecord = {
    locale,
    relativePath,
    fullPath,
    data,
    dirty: false,
  }

  cache.set(fileKey, record)
  return record
}

function shouldTranslate(params: { force: boolean, sourceText: string, targetText?: string, cacheEntry?: CacheEntry }): boolean {
  if (params.force) {
    return true
  }

  if (!params.targetText) {
    return true
  }

  if (params.targetText.trim().length === 0) {
    return true
  }

  if (params.targetText.trim() === params.sourceText.trim()) {
    return true
  }

  if (!params.cacheEntry) {
    return false
  }

  const newHash = hashString(params.sourceText)
  return params.cacheEntry.sourceHash !== newHash
}

function chunkJobs(jobs: TranslationJob[], size: number): TranslationJob[][] {
  const chunks: TranslationJob[][] = []
  for (let i = 0; i < jobs.length; i += size) {
    chunks.push(jobs.slice(i, i + size))
  }
  return chunks
}

function buildPromptMessages(input: {
  locale: string
  baseLocale: string
  projectContext: string
  guideline?: LocaleGuideline
  jobs: TranslationJob[]
  overrides: string[]
  styleOverride?: string
}): PromptMessage[] {
  const localeDescription = input.guideline
    ? `Target locale: ${input.guideline.displayName} (${input.locale}). Tone: ${input.guideline.defaultTone}. Voice: ${input.guideline.voiceDescription}.`
    : `Target locale: ${input.locale}.`

  const styleRules = input.guideline?.styleNotes ?? []
  const reservedTerms = input.guideline?.reservedTerms ?? []

  const rules = [
    `Translate from ${input.baseLocale} into ${input.locale}.`,
    'Always keep ICU-style placeholders such as {name} intact.',
    'Preserve HTML tags if they appear.',
    'Return valid JSON without code fences.',
    'If the source text is already language agnostic (e.g., product name), you may keep it as-is but still respond in JSON.',
  ]

  if (styleRules.length > 0) {
    rules.push(`Locale specific notes: ${styleRules.join(' ')}`)
  }

  if (input.styleOverride) {
    rules.push(`Override tone/style preference: ${input.styleOverride}`)
  }

  if (input.overrides.length > 0) {
    rules.push(`Additional instructions: ${input.overrides.join(' ')}`)
  }

  if (reservedTerms.length > 0) {
    rules.push(`Reserved/unchanged terms: ${reservedTerms.join(', ')}`)
  }

  const jobBlock = input.jobs
    .map((job, index) => {
      const placeholderInfo = job.placeholders.length > 0
        ? `Placeholders: ${job.placeholders.join(', ')}`
        : 'Placeholders: none'

      const existing = job.existingText ? `Current translation: ${job.existingText}` : 'Current translation: (missing)'

      return [
        `${index + 1}. id: ${job.id}`,
        `   path: ${job.displayPath}`,
        `   source: ${job.sourceText}`,
        `   ${existing}`,
        `   ${placeholderInfo}`,
      ].join('\n')
    })
    .join('\n')

  const projectInfo = input.projectContext?.trim()
    ? input.projectContext.trim()
    : 'This is a reusable SaaS template. Use neutral enterprise SaaS wording unless instructed otherwise.'

  const systemMessage = [
    'You are a senior localization strategist for a multi-market SaaS platform.',
    localeDescription,
    'Deliver culturally aware translations that sound natural for the target audience while keeping the original intent.',
  ].join(' ')

  const userMessage = [
    `Project context:\n${projectInfo}`,
    '',
    'Guidelines:',
    ...rules.map(rule => `- ${rule}`),
    '',
    'Entries to translate:',
    jobBlock,
    '',
    'Respond with JSON shaped like:',
    '{ "translations": [ { "id": "locale::file::path", "text": "translated text" } ] }',
  ].join('\n')

  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage },
  ]
}

function applyTranslation(target: any, keyPath: string, value: string) {
  const segments = keyPath.split('.')
  let cursor = target

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]
    if (i === segments.length - 1) {
      cursor[segment] = value
    }
    else {
      if (!cursor[segment] || typeof cursor[segment] !== 'object') {
        cursor[segment] = {}
      }
      cursor = cursor[segment]
    }
  }
}

async function persistTargetFiles(files: Map<string, TargetFileRecord>) {
  for (const record of files.values()) {
    if (!record.dirty)
      continue
    await mkdir(dirname(record.fullPath), { recursive: true })
    await writeFile(record.fullPath, `${JSON.stringify(record.data, null, 2)}\n`, 'utf-8')
    console.log(`Wrote ${relative(process.cwd(), record.fullPath)}`)
  }
}

async function loadTranslationCache(locale: string): Promise<TranslationCache> {
  const cachePath = join(CACHE_DIR, `${locale}.json`)
  try {
    const raw = await readFile(cachePath, 'utf-8')
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>
    return {
      locale,
      path: cachePath,
      entries: parsed,
      dirty: false,
    }
  }
  catch {
    return {
      locale,
      path: cachePath,
      entries: {},
      dirty: false,
    }
  }
}

async function persistCaches(caches: Map<string, TranslationCache>) {
  await mkdir(CACHE_DIR, { recursive: true })
  for (const cache of caches.values()) {
    if (!cache.dirty)
      continue
    await writeFile(cache.path, `${JSON.stringify(cache.entries, null, 2)}\n`, 'utf-8')
    console.log(`Updated cache ${relative(process.cwd(), cache.path)}`)
  }
}

function applyCachePrimes(primes: PendingCachePrime[], caches: Map<string, TranslationCache>) {
  if (primes.length === 0)
    return
  for (const prime of primes) {
    const cache = caches.get(prime.locale)
    if (!cache)
      continue
    cache.entries[prime.cacheKey] = {
      sourceHash: prime.hash,
      updatedAt: new Date().toISOString(),
    }
    cache.dirty = true
  }
}

async function buildProjectContext(options: CliOptions): Promise<string> {
  const parts: string[] = []

  try {
    const pkgRaw = await readFile(join(process.cwd(), 'package.json'), 'utf-8')
    const pkg = JSON.parse(pkgRaw)
    parts.push([
      `Product name: ${pkg.name ?? 'N/A'}`,
      pkg.description ? `Description: ${pkg.description}` : null,
    ].filter(Boolean).join('\n'))
  }
  catch {
    // ignore
  }

  const readmePath = join(process.cwd(), 'README.md')
  if (existsSync(readmePath)) {
    try {
      const readme = await readFile(readmePath, 'utf-8')
      parts.push(`README excerpt:\n${trimTo(readme, 1200)}`)
    }
    catch {
      // ignore
    }
  }

  for (const relativePath of options.contextFilePaths) {
    const path = resolve(process.cwd(), relativePath)
    try {
      const content = await readFile(path, 'utf-8')
      parts.push(`Context from ${relative(process.cwd(), path)}:\n${trimTo(content, 1000)}`)
    }
    catch {
      console.warn(`WARN: Could not read context file: ${relative(process.cwd(), path)}`)
    }
  }

  for (const snippet of options.contexts) {
    parts.push(`User provided context: ${snippet}`)
  }

  return parts.join('\n\n')
}

function trimTo(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, maxLength)}...`
}

function normalizeProvider(value?: string | null): Exclude<ProviderChoice, 'auto'> | undefined {
  if (!value) {
    return undefined
  }
  const normalized = value.trim().toLowerCase()
  if (normalized === 'mock' || normalized === 'openai' || normalized === 'gemini') {
    return normalized
  }
  return undefined
}

function splitList(value: string, delimiter = ','): string[] {
  return value
    .split(delimiter)
    .map(token => token.trim())
    .filter(token => token.length > 0)
}

function resolveProviderChoice(requested: ProviderChoice): Exclude<ProviderChoice, 'auto'> {
  if (requested !== 'auto') {
    return requested
  }
  if (process.env.OPENAI_API_KEY) {
    return 'openai'
  }
  if (process.env.GEMINI_API_KEY) {
    return 'gemini'
  }
  return 'mock'
}

function resolveModelName(provider: Exclude<ProviderChoice, 'auto'>, explicit?: string): string {
  if (explicit) {
    return explicit
  }

  if (provider === 'openai') {
    return process.env.OPENAI_TRANSLATION_MODEL
      ?? process.env.TRANSLATION_MODEL
      ?? 'gpt-4o-mini'
  }

  if (provider === 'gemini') {
    return process.env.GEMINI_TRANSLATION_MODEL
      ?? process.env.TRANSLATION_MODEL
      ?? 'gemini-1.5-pro'
  }

  return ''
}

function loadEnvFile(filename = '.env') {
  const envPath = join(process.cwd(), filename)
  if (!existsSync(envPath)) {
    return
  }

  try {
    const raw = readFileSync(envPath, 'utf-8')
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().length === 0) {
        continue
      }
      if (line.trimStart().startsWith('#')) {
        continue
      }

      // eslint-disable-next-line regexp/no-super-linear-backtracking,regexp/no-useless-quantifier
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (!match) {
        continue
      }

      const [, key, rawValue = ''] = match
      let value = rawValue.trim()

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/\\n/g, '\n')
      }
      else if (value.startsWith('\'') && value.endsWith('\'')) {
        value = value.slice(1, -1)
      }

      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  }
  catch (error) {
    console.warn(`WARN: Failed to load ${filename}:`, error)
  }
}

function parseModelJson(payload: string): Record<string, string> {
  const cleaned = payload
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  if (!cleaned) {
    return {}
  }

  try {
    const parsed = JSON.parse(cleaned) as any
    if (Array.isArray(parsed?.translations)) {
      return Object.fromEntries(
        parsed.translations
          .filter((entry: any) => entry?.id && typeof entry.text === 'string')
          .map((entry: any) => [entry.id, entry.text as string]),
      )
    }

    if (typeof parsed === 'object') {
      return Object.fromEntries(
        Object.entries(parsed)
          .filter(([, value]) => typeof value === 'string')
          .map(([key, value]) => [key, value as string]),
      )
    }
  }
  catch (error) {
    console.error('WARN: Failed to parse model JSON payload:', error)
  }

  return {}
}

async function createTranslator(options: CliOptions): Promise<Translator> {
  const provider = resolveProviderChoice(options.provider)

  switch (provider) {
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required when using the OpenAI provider.')
      }
      const model = resolveModelName('openai', options.model)
      return new OpenAITranslator(apiKey, model)
    }
    case 'gemini': {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is required when using the Gemini provider.')
      }
      const model = resolveModelName('gemini', options.model)
      return new GeminiTranslator(apiKey, model)
    }
    default:
      return new MockTranslator()
  }
}

class MockTranslator implements Translator {
  async translate(request: TranslateRequest): Promise<Record<string, string>> {
    const result: Record<string, string> = {}
    for (const job of request.jobs) {
      result[job.id] = `[mock ${job.locale}] ${job.sourceText}`
    }
    return result
  }
}

class OpenAITranslator implements Translator {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async translate(request: TranslateRequest): Promise<Record<string, string>> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: request.messages,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`OpenAI API error (${response.status}): ${text}`)
    }

    const data = await response.json() as any
    const content = data.choices?.[0]?.message?.content
    let payload = ''

    if (typeof content === 'string') {
      payload = content
    }
    else if (Array.isArray(content)) {
      payload = content.map((item: any) => item?.text ?? '').join('\n')
    }

    return parseModelJson(payload)
  }
}

class GeminiTranslator implements Translator {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async translate(request: TranslateRequest): Promise<Record<string, string>> {
    const prompt = request.messages
      .map(message => `${message.role.toUpperCase()}:\n${message.content}`)
      .join('\n\n')

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Gemini API error (${response.status}): ${text}`)
    }

    const data = await response.json() as any
    const payload = data.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text ?? '')
      .join('\n') ?? ''

    return parseModelJson(payload)
  }
}

main().catch((error) => {
  console.error('ERROR: auto-translate script failed:', error)
  process.exit(1)
})

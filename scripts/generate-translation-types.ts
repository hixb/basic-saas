import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// 从字符串中提取占位符
function extractPlaceholders(str: string): string[] {
  const matches = str.matchAll(/\{(\w+)\}/g)
  return Array.from(matches, m => m[1])
}

// 递归收集所有翻译键及其占位符
function collectKeysWithPlaceholders(
  obj: any,
  prefix: string = '',
): Record<string, string[]> {
  const result: Record<string, string[]> = {}

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'string') {
      result[fullKey] = extractPlaceholders(value)
    }
    else if (typeof value === 'object' && value !== null) {
      Object.assign(result, collectKeysWithPlaceholders(value, fullKey))
    }
  }

  return result
}

async function generateTranslationTypes(): Promise<void> {
  const messagesDir = join(process.cwd(), 'messages/en')
  const files = await readdir(messagesDir)
  const jsonFiles = files.filter((file: string) => file.endsWith('.json'))

  if (jsonFiles.length === 0) {
    console.warn('⚠️  No JSON files found in messages/en/')
    return
  }

  // 读取所有 JSON 文件内容来生成精确的类型
  const jsonContents: Record<string, any> = {}
  const keysWithPlaceholders: Record<string, Record<string, string[]>> = {}

  for (const file of jsonFiles) {
    const namespace = file.replace('.json', '')
    const content = await readFile(join(messagesDir, file), 'utf-8')
    jsonContents[namespace] = JSON.parse(content)
    keysWithPlaceholders[namespace] = collectKeysWithPlaceholders(jsonContents[namespace])
  }

  const imports = jsonFiles
    .map((file: string) => {
      const namespace = file.replace('.json', '')
      return `import ${namespace} from '../messages/en/${file}' with { type: 'json' }`
    })
    .join('\n')

  const namespaces = jsonFiles
    .map((file: string) => `'${file.replace('.json', '')}'`)
    .join(' | ')

  const messagesInterface = jsonFiles
    .map((file: string) => {
      const namespace = file.replace('.json', '')
      return `  ${namespace}: typeof ${namespace}`
    })
    .join('\n')

  const translationKeysInterface = jsonFiles
    .map((file: string) => {
      const namespace = file.replace('.json', '')
      return `  ${namespace}: NestedKeyOf<typeof ${namespace}>`
    })
    .join('\n')

  // 生成参数映射接口
  const translationParamsInterfaces = jsonFiles
    .map((file: string) => {
      const namespace = file.replace('.json', '')
      const keys = keysWithPlaceholders[namespace]
      const entries = Object.entries(keys)
        .map(([key, placeholders]) => {
          if (placeholders.length === 0) {
            return `    '${key}': void`
          }
          const params = placeholders.map(p => `${p}: string | number | boolean | Date | null | undefined`).join(', ')
          return `    '${key}': { ${params} }`
        })
        .join('\n')

      return `  ${namespace}: {\n${entries}\n  }`
    })
    .join('\n')

  const content = `${imports}

type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? K extends string
          ? | \`\${Prefix}\${K}\`
          | NestedKeyOf<T[K], \`\${Prefix}\${K}.\`>
          : never
        : \`\${Prefix}\${K}\`;
    }[keyof T & string]
  : never

export type Namespace = ${namespaces}

export interface Messages {
${messagesInterface}
}

export interface TranslationKeys {
${translationKeysInterface}
}

export interface TranslationParamsMap {
${translationParamsInterfaces}
}

export type AllTranslationKeys = {
  [K in Namespace]: \`\${K}.\${TranslationKeys[K]}\`
}[Namespace]

type SplitPath<Path extends string>
  = Path extends \`\${infer N}.\${infer K}\`
    ? N extends Namespace
      ? K extends TranslationKeys[N]
        ? { namespace: N, key: K }
        : never
      : never
    : never

export type TranslationFunctionParams<N extends Namespace, K extends TranslationKeys[N]>
  = K extends keyof TranslationParamsMap[N]
    ? TranslationParamsMap[N][K]
    : void

export type GlobalTranslationParams<Path extends AllTranslationKeys>
  = SplitPath<Path> extends { namespace: infer N, key: infer K }
    ? N extends Namespace
      ? K extends TranslationKeys[N]
        ? TranslationFunctionParams<N, K>
        : void
      : void
    : void

declare global {
  interface IntlMessages extends Messages {}
}

export {}
`

  const outputPath = join(process.cwd(), 'types/translation-keys.ts')
  await writeFile(outputPath, content, 'utf-8')
  console.log('✅ Translation types generated successfully!')
  console.log(`📝 Generated types for: ${jsonFiles.map(f => f.replace('.json', '')).join(', ')}`)
}

generateTranslationTypes().catch((error: Error) => {
  console.error('❌ Failed to generate translation types:', error)
  process.exit(1)
})

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function loadEnvFile() {
  const envPath = join(process.cwd(), '.env')
  const content = readFileSync(envPath, 'utf8')

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('='))
      continue

    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')

    process.env[key.trim()] ??= value
  }
}

async function clearAnalyticsSessions() {
  loadEnvFile()

  const { db } = await import('~/server/infrastructure/database')
  const { analyticsSessions } = await import('~/server/infrastructure/database/schema/analytics-session.schema')

  await db.delete(analyticsSessions)
}

clearAnalyticsSessions()
  .then(() => {
    console.log('Analytics sessions cleared.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to clear analytics sessions.', error)
    process.exit(1)
  })

import { execSync } from 'node:child_process'
import { watch } from 'node:fs'
import { join } from 'node:path'

const messagesDir = join(process.cwd(), 'messages')

generateTypes()

const watcher = watch(messagesDir, { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith('.json')) {
    generateTypes()
  }
})

function generateTypes() {
  try {
    execSync('tsx scripts/generate-translation-types.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
  }
  catch (error) {
    console.error('❌ Failed to generate types:', error)
  }
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping translation watcher...')
  watcher.close()
  process.exit(0)
})

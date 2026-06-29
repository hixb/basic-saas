import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/infrastructure/database/schema/index.ts',
  out: './server/infrastructure/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})

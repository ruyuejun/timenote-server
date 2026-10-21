import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema',
    dialect: 'mysql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
})

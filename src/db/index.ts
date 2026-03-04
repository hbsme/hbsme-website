import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://hbsme:hbsme@localhost:5432/hbsme',
})

export const db = drizzle(pool, { schema })

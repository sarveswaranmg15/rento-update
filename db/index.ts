import { Pool } from 'pg'
import { loadEnv, getEnv, getParsedEnv } from './env'

// ensure .env variables are loaded into process.env
const parsed = loadEnv()

// debug: show where DATABASE_URL is coming from
try {
    const parsedEnv = getParsedEnv()
    console.debug('DB debug — process.env.DATABASE_URL =', process.env.DATABASE_URL)
    console.debug('DB debug — parsed .env DATABASE_URL =', parsedEnv && parsedEnv.DATABASE_URL)
} catch (e) {
    // ignore
}

const connectionString = getEnv('DATABASE_URL')

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables')
}

const pool = new Pool({
    connectionString,
})

export default pool

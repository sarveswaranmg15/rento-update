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

// Determine SSL settings
let ssl: false | { rejectUnauthorized: boolean } = false
try {
    const sslEnabled = (getEnv('DATABASE_SSL_ENABLED') || '').toLowerCase() === 'true'
    const rejectUnauthorized = (getEnv('DATABASE_REJECT_UNAUTHORIZED') || '').toLowerCase() === 'true'
    // Prefer hostname from DATABASE_URL; fallback to env host
    let hostFromUrl = ''
    try { hostFromUrl = new URL(connectionString).hostname } catch {}
    const host = hostFromUrl || getEnv('DATABASE_HOST') || ''
    const isLocal = host === 'localhost' || host === '127.0.0.1'
    if (sslEnabled && !isLocal) {
        ssl = { rejectUnauthorized }
    } else {
        ssl = false
    }
    console.debug('DB debug — resolved SSL =', ssl ? `{ rejectUnauthorized: ${rejectUnauthorized} }` : 'false', 'host =', host || '(unknown)')
} catch {
    ssl = false
}

const pool = new Pool({
    connectionString,
    ssl,
})

export default pool

import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

export function loadEnv(override = true) {
    const envPath = path.resolve(process.cwd(), '.env')
    let parsed: Record<string, string> | null = null
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8')
        parsed = dotenv.parse(content)
        // inject into process.env
        for (const k of Object.keys(parsed)) {
            if (override || process.env[k] === undefined) {
                process.env[k] = parsed[k]
            }
        }
    } else {
        // fallback: let dotenv attempt default loading
        const res = dotenv.config()
        if (res.parsed) {
            parsed = res.parsed
            for (const k of Object.keys(res.parsed)) {
                if (override || process.env[k] === undefined) {
                    process.env[k] = res.parsed[k]
                }
            }
        }
    }
    return parsed || null
}

export function getEnv(key: string, fallback?: string): string | undefined {
    const v = process.env[key]
    if (v !== undefined && v !== null && v !== '') return v
    return fallback
}

export function getParsedEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env')
        if (!fs.existsSync(envPath)) return null
        const content = fs.readFileSync(envPath, 'utf8')
        return dotenv.parse(content)
    } catch (e) {
        return null
    }
}

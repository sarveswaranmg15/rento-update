import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import pool from '@/db'

export const runtime = 'nodejs'

// Dev-only: apply all SQL files in db-functions to the connected DB
export async function POST(_req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
    }

    const dir = path.resolve(process.cwd(), 'db-functions')
    try {
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
        for (const f of files) {
            const sql = fs.readFileSync(path.join(dir, f), 'utf8')
            // execute the SQL file contents
            await pool.query(sql)
        }

        return NextResponse.json({ ok: true, applied: files.length })
    } catch (err: any) {
        console.error('[dev/sync-db] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

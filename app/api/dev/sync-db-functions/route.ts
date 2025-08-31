import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import pool from '@/db'

export const runtime = 'nodejs'

// Dev-only: apply only SQL files in db-functions folder and return per-file results
export async function POST(_req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
    }

    const dir = path.resolve(process.cwd(), 'db-functions')
    const results: Array<any> = []
    try {
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
        for (const f of files) {
            const filePath = path.join(dir, f)
            const sql = fs.readFileSync(filePath, 'utf8')
            try {
                // Execute the SQL file contents; many files include $$ function bodies
                await pool.query(sql)
                results.push({ file: f, ok: true })
            } catch (err: any) {
                // Capture the error message but continue with next files
                console.error('[dev/sync-db-functions] error in', f, err?.message || err)
                results.push({ file: f, ok: false, error: err?.message || String(err) })
            }
        }

        return NextResponse.json({ ok: true, results })
    } catch (err: any) {
        console.error('[dev/sync-db-functions] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import pool from '@/db'
import { getTenantSchema } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const subdomain = url.searchParams.get('subdomain') || process.env.NEXT_PUBLIC_TENANT || ''
        const schema = await getTenantSchema(subdomain)
        if (!schema) return NextResponse.json({ error: 'tenant not found' }, { status: 400 })

        const res = await pool.query(`SELECT * FROM public.get_admin_metrics($1)`, [schema])
        const row = res.rows?.[0] || { total_companies: 0, total_hr: 0, total_fleets: 0 }
        // coerce numeric strings (PG returns bigint/numeric as string) to JS numbers
        const metrics = {
            total_companies: row.total_companies !== undefined ? Number(row.total_companies) : 0,
            total_hr: row.total_hr !== undefined ? Number(row.total_hr) : 0,
            total_fleets: row.total_fleets !== undefined ? Number(row.total_fleets) : 0,
            total_companies_change: row.total_companies_change !== undefined ? Number(row.total_companies_change) : 0,
            total_hr_change: row.total_hr_change !== undefined ? Number(row.total_hr_change) : 0,
            total_fleets_change: row.total_fleets_change !== undefined ? Number(row.total_fleets_change) : 0,
        }
        return NextResponse.json({ ok: true, metrics })
    } catch (err: any) {
        console.error('[api/admin/metrics] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

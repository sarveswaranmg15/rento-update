import { NextRequest, NextResponse } from 'next/server'
import pool from '@/db'
import { getTenantSchema } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const subdomain = url.searchParams.get('subdomain') || process.env.NEXT_PUBLIC_TENANT || ''
        const schema = await getTenantSchema(subdomain)
        if (!schema) {
            return NextResponse.json({ error: 'tenant not found' }, { status: 400 })
        }

        // get counts
        const countsRes = await pool.query(`SELECT * FROM public.get_dashboard_counts($1)`, [schema])
        const tenantsRes = await pool.query(`SELECT * FROM public.get_tenants_list()`)

        const counts = countsRes.rows?.[0] ?? { total_drivers: 0, total_employees: 0 }
        const tenants = tenantsRes.rows ?? []

        return NextResponse.json({ ok: true, counts, tenants })
    } catch (err: any) {
        console.error('[api/metrics/dashboard] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

import { NextRequest } from 'next/server'
import pool from '@/db'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
    try {
        const q = `SELECT id, subdomain, schema_name FROM public.tenants WHERE status = 'active' ORDER BY subdomain`
        const res = await pool.query(q)
        const tenants = (res.rows || []).map((r: any) => ({
            id: r.id,
            subdomain: r.subdomain,
            schema_name: r.schema_name,
            label: r.subdomain || r.schema_name,
        }))
        return new Response(JSON.stringify({ ok: true, tenants }), { status: 200 })
    } catch (err: any) {
        console.error('tenants API error', err)
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
    }
}

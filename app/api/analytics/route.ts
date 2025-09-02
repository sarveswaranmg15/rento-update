import { NextRequest } from 'next/server'
import pool from '@/db'

export const runtime = 'nodejs'

function isSafeIdentifier(s: any) {
    return typeof s === 'string' && /^[a-zA-Z0-9_]+$/.test(s)
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const schema = url.searchParams.get('schema') || null
        const subdomain = url.searchParams.get('subdomain') || null
        const days = parseInt(url.searchParams.get('days') || '30', 10)

        async function exec(schemaName: string) {
            const base = await pool.query('SELECT * FROM public.get_analytics_in_schema($1,$2)', [schemaName, isNaN(days) ? 30 : days])
            const companies = await pool.query('SELECT * FROM public.get_company_bookings_in_schema($1,$2)', [schemaName, isNaN(days) ? 30 : days])
            const hex = await pool.query('SELECT * FROM public.get_hex_bins_in_schema($1,$2)', [schemaName, isNaN(days) ? 30 : days])
            return { metrics: base.rows?.[0] || null, companies: companies.rows || [], hex: hex.rows || [] }
        }

        if (schema && isSafeIdentifier(schema)) {
            const data = await exec(schema)
            return new Response(JSON.stringify({ ok: true, ...data, schema }), { status: 200 })
        }

        if (subdomain) {
            try {
                const r = await pool.query("SELECT schema_name FROM public.tenants WHERE subdomain = $1 AND status = 'active' LIMIT 1", [subdomain.toLowerCase()])
                const s = r.rows?.[0]?.schema_name
                if (s && isSafeIdentifier(s)) {
                    const data = await exec(s)
                    return new Response(JSON.stringify({ ok: true, ...data, schema: s }), { status: 200 })
                }
            } catch { }
        }

        // fallback: try first active tenant
        try {
            const r = await pool.query("SELECT schema_name FROM public.tenants WHERE status = 'active' LIMIT 1")
            const s = r.rows?.[0]?.schema_name
            if (s && isSafeIdentifier(s)) {
                const data = await exec(s)
                return new Response(JSON.stringify({ ok: true, ...data, schema: s }), { status: 200 })
            }
        } catch { }

        return new Response(JSON.stringify({ ok: true, metrics: null, companies: [], hex: [] }), { status: 200 })
    } catch (err: any) {
        console.error(err)
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
    }
}

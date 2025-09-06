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

function isSafeSubdomain(s: any) {
    return typeof s === 'string' && /^[a-z0-9_]+$/.test(s)
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const company_name = String(body?.company_name || '').trim()
        const subdomain_raw = String(body?.subdomain || '').trim().toLowerCase()
        const company_code_raw = (body?.company_code == null ? '' : String(body.company_code)).trim()
        const contact_email = String(body?.contact_email || '').trim().toLowerCase()
        const contact_phone = body?.contact_phone ? String(body.contact_phone).trim() : null
        const address = body?.address ? String(body.address).trim() : null
        const city = body?.city ? String(body.city).trim() : null
        const state = body?.state ? String(body.state).trim() : null
        const created_by = null // TODO: wire to authenticated user id if available

        if (!company_name) return new Response(JSON.stringify({ ok: false, error: 'company_name required' }), { status: 400 })
        if (!subdomain_raw) return new Response(JSON.stringify({ ok: false, error: 'subdomain required' }), { status: 400 })
        if (!contact_email) return new Response(JSON.stringify({ ok: false, error: 'contact_email required' }), { status: 400 })
        if (!isSafeSubdomain(subdomain_raw)) return new Response(JSON.stringify({ ok: false, error: 'invalid subdomain. Use lowercase letters, numbers, or _' }), { status: 400 })

        const subdomain = subdomain_raw
        const schema_name = `tenant_${subdomain}`
        // Basic collision checks
        const dup = await pool.query(`SELECT 1 FROM public.tenants WHERE subdomain = $1 OR schema_name = $2 LIMIT 1`, [subdomain, schema_name])
        if (dup.rows && dup.rows.length > 0) {
            return new Response(JSON.stringify({ ok: false, error: 'tenant already exists' }), { status: 409 })
        }

        const company_code = company_code_raw || company_name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase() || subdomain.toUpperCase()

        // Use DB function to insert tenant row and create schema tables
        const q = `SELECT onboard_tenant($1,$2,$3,$4,$5,$6,$7,$8,$9) AS id`
        const params = [company_name, subdomain, company_code, contact_email, contact_phone, address, city, state, created_by]
        const { rows } = await pool.query(q, params)
        const tenant_id = rows?.[0]?.id || null
        if (!tenant_id) {
            return new Response(JSON.stringify({ ok: false, error: 'failed to create tenant' }), { status: 500 })
        }
        return new Response(JSON.stringify({ ok: true, tenant_id, schema_name, subdomain, company_code }), { status: 200 })
    } catch (err: any) {
        console.error('tenants POST error', err)
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
    }
}

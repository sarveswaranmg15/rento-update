import { NextRequest } from 'next/server'
import pool from '@/db'
export const runtime = 'nodejs'

function isSafeIdentifier(s: any) {
    return typeof s === 'string' && /^[a-zA-Z0-9_]+$/.test(s)
}

function getCookie(req: NextRequest, name: string) {
    const cookieHeader = req.headers.get('cookie') || ''
    const part = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))
    return part ? decodeURIComponent(part.split('=')[1]) : null
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const email = url.searchParams.get('email') || process.env.DEFAULT_USER_EMAIL || null
        const id = url.searchParams.get('id') || null
        const schema = url.searchParams.get('schema') || getCookie(req, 'tenant_schema') || null
        const subdomain = url.searchParams.get('subdomain') || null

        // Prefer tenant schema function so roles are joined
        if (schema && isSafeIdentifier(schema) && id) {
            try {
                const funcRes = await pool.query('SELECT * FROM public.get_profile_by_id_in_schema($1,$2)', [schema, id])
                if (funcRes.rows && funcRes.rows.length > 0) {
                    const u = funcRes.rows[0]
                    if (u && u.rides_count == null) u.rides_count = 0
                    return new Response(JSON.stringify({ ok: true, user: u, schema }), { status: 200 })
                }
            } catch (e) {
                console.error('get_profile_by_id_in_schema error', { schema, id, e })
            }
        }

        // If no schema provided, try to resolve schema via subdomain or scan tenants
        if (id && !schema) {
            // Try resolve schema from subdomain param
            if (subdomain) {
                try {
                    const r = await pool.query("SELECT schema_name FROM public.tenants WHERE subdomain = $1 AND status = 'active' LIMIT 1", [subdomain.toLowerCase()])
                    const resolved = r.rows?.[0]?.schema_name
                    if (resolved && isSafeIdentifier(resolved)) {
                        const sres = await pool.query('SELECT * FROM public.get_profile_by_id_in_schema($1,$2)', [resolved, id])
                        if (sres.rows && sres.rows.length > 0) {
                            const u = sres.rows[0]
                            if (u && u.rides_count == null) u.rides_count = 0
                            return new Response(JSON.stringify({ ok: true, user: u, schema: resolved }), { status: 200 })
                        }
                    }
                } catch (e) {
                    console.error('resolve schema by subdomain failed', subdomain, e)
                }
            }

            // Scan all active tenant schemas
            try {
                const tenants = await pool.query("SELECT schema_name FROM public.tenants WHERE status = 'active'")
                for (const row of tenants.rows || []) {
                    const sname = row.schema_name
                    if (!sname || !isSafeIdentifier(sname)) continue
                    try {
                        const tres = await pool.query('SELECT * FROM public.get_profile_by_id_in_schema($1,$2)', [sname, id])
                        if (tres.rows && tres.rows.length > 0) {
                            const u = tres.rows[0]
                            if (u && u.rides_count == null) u.rides_count = 0
                            return new Response(JSON.stringify({ ok: true, user: u, schema: sname }), { status: 200 })
                        }
                    } catch (e) {
                        // ignore and continue
                    }
                }
            } catch (e) {
                console.error('scan tenants failed', e)
            }
        }

        // Fall back to public.get_profile_by_id (only checks public.users)
        if (id) {
            try {
                const q = 'SELECT * FROM public.get_profile_by_id($1)'
                const res = await pool.query(q, [id])
                const user = res.rows?.[0] || null
                if (user) return new Response(JSON.stringify({ ok: true, user }), { status: 200 })
            } catch (e) {
                console.error('get_profile_by_id error', e)
            }

            // Fallback to public.users direct
            try {
                const resPub = await pool.query('SELECT id, first_name, last_name, phone, email, role, COALESCE(rides_count,0) as rides_count, avatar_url FROM public.users WHERE id::text = $1 LIMIT 1', [id])
                if (resPub.rows && resPub.rows.length > 0) return new Response(JSON.stringify({ ok: true, user: resPub.rows[0] }), { status: 200 })
            } catch (e) { }

            return new Response(JSON.stringify({ ok: true, user: null }), { status: 200 })
        }

        if (email) {
            const q = 'SELECT * FROM public.get_profile($1)'
            const res = await pool.query(q, [email])
            const user = res.rows?.[0] || null
            return new Response(JSON.stringify({ ok: true, user }), { status: 200 })
        }

        // No email provided: try to return first user from public.users
        try {
            const resPub = await pool.query('SELECT id, first_name, last_name, phone, email, role, COALESCE(rides_count,0) as rides_count, avatar_url FROM public.users LIMIT 1')
            if (resPub.rows && resPub.rows.length > 0) {
                return new Response(JSON.stringify({ ok: true, user: resPub.rows[0] }), { status: 200 })
            }
        } catch (e) { }

        return new Response(JSON.stringify({ ok: true, user: null }), { status: 200 })
    } catch (err: any) {
        console.error(err)
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const id = String(body?.id || '')
        let schema = body?.schema || getCookie(req, 'tenant_schema') || null
        if (!id) {
            return new Response(JSON.stringify({ ok: false, error: 'missing id' }), { status: 400 })
        }
        // If schema is missing, try to resolve by scanning active tenants to find the user
        if (!schema) {
            try {
                const tenants = await pool.query("SELECT schema_name FROM public.tenants WHERE status = 'active'")
                for (const row of tenants.rows || []) {
                    const sname = row.schema_name
                    if (!sname || !isSafeIdentifier(sname)) continue
                    try {
                        const exists = await pool.query(`SELECT 1 FROM ${sname}.users WHERE id::text = $1 LIMIT 1`, [id])
                        if (exists.rows && exists.rows.length > 0) { schema = sname; break }
                    } catch { /* ignore */ }
                }
            } catch { /* ignore */ }
        }
        if (!schema || !isSafeIdentifier(schema)) {
            return new Response(JSON.stringify({ ok: false, error: 'missing id or schema' }), { status: 400 })
        }
        const first_name = body?.first_name ?? null
        const last_name = body?.last_name ?? null
        const phone = body?.phone ?? null
        const email = body?.email ?? null
        const avatar_url = body?.avatar_url ?? null
        const avatar_image_base64 = body?.avatar_image_base64 ?? null
        const { rows } = await pool.query('SELECT public.update_profile_in_schema($1::text,$2::text,$3::text,$4::text,$5::text,$6::text,$7::text,$8::text) AS updated', [schema, id, first_name, last_name, phone, email, avatar_url, avatar_image_base64])
        return new Response(JSON.stringify({ ok: true, updated: rows?.[0]?.updated || 0 }), { status: 200 })
    } catch (err: any) {
        console.error(err)
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
    }
}

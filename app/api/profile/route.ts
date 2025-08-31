import { NextRequest } from 'next/server'
import pool from '@/db'
export const runtime = 'nodejs'

function isSafeIdentifier(s: any) {
    return typeof s === 'string' && /^[a-zA-Z0-9_]+$/.test(s)
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const email = url.searchParams.get('email') || process.env.DEFAULT_USER_EMAIL || null
        const id = url.searchParams.get('id') || null
        const schema = url.searchParams.get('schema') || null

        // if schema provided and safe, try querying schema.users directly
        if (schema && isSafeIdentifier(schema)) {
            try {
                if (id) {
                    const q = `SELECT id, first_name, last_name, phone, email, role, COALESCE(rides_count,0) as rides_count, avatar_url FROM ${schema}.users WHERE id::text = $1 LIMIT 1`
                    const res = await pool.query(q, [id])
                    if (res.rows && res.rows.length > 0) return new Response(JSON.stringify({ ok: true, user: res.rows[0] }), { status: 200 })
                }
                if (email) {
                    const q2 = `SELECT id, first_name, last_name, phone, email, role, COALESCE(rides_count,0) as rides_count, avatar_url FROM ${schema}.users WHERE email = $1 LIMIT 1`
                    const res2 = await pool.query(q2, [email])
                    if (res2.rows && res2.rows.length > 0) return new Response(JSON.stringify({ ok: true, user: res2.rows[0] }), { status: 200 })
                }
            } catch (e) {
                console.error('tenant schema query failed', schema, e)
            }
        }

        if (id) {
            try {
                const q = 'SELECT * FROM public.get_profile_by_id($1)'
                const res = await pool.query(q, [id])
                const user = res.rows?.[0] || null
                if (user) return new Response(JSON.stringify({ ok: true, user }), { status: 200 })
            } catch (e) {
                console.error('get_profile_by_id error', e)
            }

            // Fallbacks continue... (direct public/auth lookups)
            try {
                const resPub = await pool.query('SELECT id, first_name, last_name, phone, email, role, COALESCE(rides_count,0) as rides_count, avatar_url FROM public.users WHERE id::text = $1 LIMIT 1', [id])
                if (resPub.rows && resPub.rows.length > 0) return new Response(JSON.stringify({ ok: true, user: resPub.rows[0] }), { status: 200 })
            } catch (e) { }

            try {
                const resAuth = await pool.query('SELECT id, first_name, last_name, phone, email, role, COALESCE(rides_count,0) as rides_count, avatar_url FROM auth.users WHERE id::text = $1 LIMIT 1', [id])
                if (resAuth.rows && resAuth.rows.length > 0) return new Response(JSON.stringify({ ok: true, user: resAuth.rows[0] }), { status: 200 })
            } catch (e) { }

            return new Response(JSON.stringify({ ok: true, user: null }), { status: 200 })
        }

        if (email) {
            const q = 'SELECT * FROM public.get_profile($1)'
            const res = await pool.query(q, [email])
            const user = res.rows?.[0] || null
            return new Response(JSON.stringify({ ok: true, user }), { status: 200 })
        }

        // No email provided: try to return first user from public.users or auth.users
        try {
            const resPub = await pool.query('SELECT id, first_name, last_name, phone, email, role, COALESCE(rides_count,0) as rides_count, avatar_url FROM public.users LIMIT 1')
            if (resPub.rows && resPub.rows.length > 0) {
                return new Response(JSON.stringify({ ok: true, user: resPub.rows[0] }), { status: 200 })
            }
        } catch (e) { }

        try {
            const resAuth = await pool.query('SELECT id, first_name, last_name, phone, email, role, COALESCE(rides_count,0) as rides_count, avatar_url FROM auth.users LIMIT 1')
            if (resAuth.rows && resAuth.rows.length > 0) {
                return new Response(JSON.stringify({ ok: true, user: resAuth.rows[0] }), { status: 200 })
            }
        } catch (e) { }

        return new Response(JSON.stringify({ ok: true, user: null }), { status: 200 })
    } catch (err: any) {
        console.error(err)
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
    }
}

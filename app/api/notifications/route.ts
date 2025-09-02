import { NextRequest } from 'next/server'
import pool from '@/db'

export const runtime = 'nodejs'

function getCookie(req: NextRequest, name: string) {
    const cookieHeader = req.headers.get('cookie') || ''
    const part = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))
    return part ? decodeURIComponent(part.split('=')[1]) : null
}

export async function GET(req: NextRequest) {
    try {
        const schema = getCookie(req, 'tenant_schema')
        if (!schema) return new Response(JSON.stringify({ ok: true, notifications: [] }), { status: 200 })
        const userId = req.headers.get('x-user-id') || null
        const limit = parseInt(new URL(req.url).searchParams.get('limit') || '10', 10)
        const { rows } = await pool.query('SELECT * FROM public.get_notifications_in_schema($1,$2,$3)', [schema, userId, isNaN(limit) ? 10 : limit])
        return new Response(JSON.stringify({ ok: true, notifications: rows || [] }), { status: 200 })
    } catch (e: any) {
        console.error('notifications GET', e)
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const schema = getCookie(req, 'tenant_schema')
        if (!schema) return new Response(JSON.stringify({ ok: false, error: 'no schema' }), { status: 400 })
        const body = await req.json()
        const userId = req.headers.get('x-user-id') || null
        const id = body?.id || null
        const markAll = !!body?.all
        const { rows } = await pool.query('SELECT public.mark_notifications_read_in_schema($1,$2,$3,$4) AS updated', [schema, userId, id, markAll])
        return new Response(JSON.stringify({ ok: true, updated: rows?.[0]?.updated || 0 }), { status: 200 })
    } catch (e: any) {
        console.error('notifications POST', e)
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 })
    }
}

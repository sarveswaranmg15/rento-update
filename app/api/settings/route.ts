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
        if (!schema) return new Response(JSON.stringify({ ok: true, settings: {} }), { status: 200 })
        const { rows } = await pool.query(`SELECT key, value FROM ${schema}.settings`)
        const settings: any = {}
        for (const r of rows) settings[r.key] = r.value
        return new Response(JSON.stringify({ ok: true, settings }), { status: 200 })
    } catch (e: any) {
        console.error('settings GET', e)
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const schema = getCookie(req, 'tenant_schema')
        if (!schema) return new Response(JSON.stringify({ ok: false, error: 'no schema' }), { status: 400 })
        const body = await req.json()
        const key = String(body?.key || '')
        const value = String(body?.value || '')
        if (!key) return new Response(JSON.stringify({ ok: false, error: 'key required' }), { status: 400 })
        await pool.query(`INSERT INTO ${schema}.settings(key, value) VALUES($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [key, value])
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
    } catch (e: any) {
        console.error('settings POST', e)
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 })
    }
}

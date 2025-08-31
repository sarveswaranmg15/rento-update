import { NextRequest, NextResponse } from 'next/server'
import pool from '@/db'
import { getTenantSchema } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const daysParam = url.searchParams.get('days') || '30'
        const days = parseInt(daysParam, 10) || 30
        const subdomain = url.searchParams.get('subdomain') || process.env.NEXT_PUBLIC_TENANT || ''
        const schema = await getTenantSchema(subdomain)
        if (!schema) return NextResponse.json({ error: 'tenant not found' }, { status: 400 })

        const trendsRes = await pool.query(`SELECT * FROM public.get_booking_trends($1, $2)`, [schema, days])
        const trends = trendsRes.rows ?? []

        return NextResponse.json({ ok: true, trends })
    } catch (err: any) {
        console.error('[api/metrics/trends] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

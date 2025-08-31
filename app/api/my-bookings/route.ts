import { NextRequest } from 'next/server'
import pool from '@/db'
import { getTenantSchema } from '@/lib/tenant'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const subdomain = url.searchParams.get('subdomain') || process.env.NEXT_PUBLIC_TENANT || ''
        const schema = await getTenantSchema(subdomain)
        if (!schema) return new Response(JSON.stringify({ ok: false, error: 'tenant not found' }), { status: 400 })

        const userId = url.searchParams.get('userId') || null
        const status = url.searchParams.get('status') || null
        const search = url.searchParams.get('search') || null
        const limit = Number(url.searchParams.get('limit') || 50)
        const offset = Number(url.searchParams.get('offset') || 0)
        const sort = url.searchParams.get('sort') || 'created_at'
        const dir = url.searchParams.get('dir') || 'desc'
        const exportFmt = url.searchParams.get('export') || null

        const q = `SELECT * FROM public.get_my_bookings($1,$2,$3,$4,$5,$6,$7,$8)`
        const res = await pool.query(q, [schema, userId, status, search, limit, offset, sort, dir])
        const rows = res.rows || []

        if (exportFmt === 'csv') {
            const header = ['booking_number', 'pickup_location', 'dropoff_location', 'scheduled_pickup_time', 'status', 'estimated_cost', 'driver_name', 'created_at']
            const escape = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
            const csv = '\uFEFF' + [header, ...rows.map(r => [r.booking_number, r.pickup_location, r.dropoff_location, r.scheduled_pickup_time, r.status, r.estimated_cost, r.driver_name, r.created_at].map(escape))].map(r => r.join(',')).join('\n')
            return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="bookings_${Date.now()}.csv"` } })
        }

        return new Response(JSON.stringify({ ok: true, bookings: rows, meta: { limit, offset } }), { status: 200 })
    } catch (err: any) {
        console.error(err)
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
    }
}

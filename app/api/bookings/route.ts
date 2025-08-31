import { NextRequest, NextResponse } from 'next/server'
import pool from '@/db'
import { getTenantSchema } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const subdomain = url.searchParams.get('subdomain') || process.env.NEXT_PUBLIC_TENANT || ''
        const schema = await getTenantSchema(subdomain)
        if (!schema) return NextResponse.json({ error: 'tenant not found' }, { status: 400 })

        const status = url.searchParams.get('status') || null
        const search = url.searchParams.get('search') || null
        const driver = url.searchParams.get('driver') || null
        const limit = Number(url.searchParams.get('limit') || 50)
        const offset = Number(url.searchParams.get('offset') || 0)
        const userId = url.searchParams.get('userId') || null

        // Call the DB function defined in db-functions/get_booking_history
        // Explicitly name columns to avoid attribute mapping issues if the function signature changes
        const q = `SELECT id, booking_number, user_name, pickup_location, dropoff_location, scheduled_pickup_time, status, estimated_cost, created_at
                   FROM public.get_booking_history($1,$2,$3,$4,$5,$6)`
        const res = await pool.query(q, [schema, userId, status, search, limit, offset])

        const rows = res.rows || []

        // Map DB result to the frontend expected shape used by bookings page
        const bookings = rows.map((r: any) => ({
            id: r.id,
            bookingNumber: r.booking_number || null,
            pickup: r.pickup_location || '',
            dropoff: r.dropoff_location || '',
            date: r.scheduled_pickup_time || r.created_at || null,
            fare: r.estimated_cost || 0,
            status: r.status || '',
            driver: r.user_name || null,
            carType: null
        }))

        return NextResponse.json({ ok: true, bookings })
    } catch (err: any) {
        console.error('[api/bookings] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

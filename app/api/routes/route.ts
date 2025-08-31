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

        const search = url.searchParams.get('search') || ''
        const sort = url.searchParams.get('sort') || 'created_at'
        const dir = (url.searchParams.get('dir') || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 500)
        const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0)

        // optional filters
        const isActiveParam = url.searchParams.get('is_active')
        let is_active: boolean | null = null
        if (isActiveParam === 'true') is_active = true
        else if (isActiveParam === 'false') is_active = false

        const min_distance = url.searchParams.get('min_distance') ? Number(url.searchParams.get('min_distance')) : null
        const max_distance = url.searchParams.get('max_distance') ? Number(url.searchParams.get('max_distance')) : null
        const start_location = url.searchParams.get('start_location') || null
        const end_location = url.searchParams.get('end_location') || null

        const routesRes = await pool.query(
            `SELECT * FROM public.get_routes($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [schema, limit, offset, search || null, sort, dir, is_active, min_distance, max_distance, start_location, end_location]
        )
        const routes = routesRes.rows || []

        const countRes = await pool.query(
            `SELECT public.get_routes_count($1,$2,$3,$4,$5,$6,$7) as total`,
            [schema, search || null, is_active, min_distance, max_distance, start_location, end_location]
        )
        const total = (countRes.rows?.[0]?.total) ?? 0

        const exportFormat = url.searchParams.get('export') || ''
        if (exportFormat === 'csv') {
            const header = ['id', 'route_code', 'name', 'start_location', 'end_location', 'estimated_distance', 'frequency_minutes', 'is_active', 'created_at']
            const rows = routes.map((r: any) => header.map(h => {
                const v = r[h]
                if (v === null || v === undefined) return ''
                return typeof v === 'string' ? v.replace(/"/g, '""') : String(v)
            }))
            const csvLines = [header.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))]
            const csv = csvLines.join('\n')
            return new NextResponse(csv, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="routes_export_${Date.now()}.csv"`
                }
            })
        }

        return NextResponse.json({ ok: true, routes, meta: { total, limit, offset } })
    } catch (err: any) {
        console.error('[api/routes] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

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

        // metrics
        const metricsRes = await pool.query(`SELECT * FROM public.get_driver_metrics($1)`, [schema])
        const metrics = metricsRes.rows?.[0] ?? { total_drivers: 0, total_fleet_managers: 0, active_drivers: 0 }

        // percent changes for drivers (original)
        const baseChangesRes = await pool.query(`SELECT * FROM public.get_dashboard_changes($1)`, [schema])
        const baseChanges = baseChangesRes.rows?.[0] ?? { drivers_change: 0, employees_change: 0 }

        // list recent drivers with server-side search/sort/pagination
        const search = url.searchParams.get('search') || ''
        const sort = url.searchParams.get('sort') || 'created_at'
        const dir = (url.searchParams.get('dir') || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200)
        const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0)

        const allowedSort = ['created_at', 'rating', 'driver_code', 'status']
        const sortField = allowedSort.includes(sort) ? sort : 'created_at'

        const values: any[] = []
        let where = ''
        if (search) {
            where = ` WHERE driver_code ILIKE $1 OR CAST(id AS TEXT) ILIKE $1`
            values.push(`%${search}%`)
        }

        const driversQuery = `SELECT id, driver_code, rating, status, created_at FROM ${schema}.drivers${where} ORDER BY ${sortField} ${dir} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`
        values.push(limit, offset)

        const driversRes = await pool.query(driversQuery, values)
        const drivers = driversRes.rows || []

        // total count for pagination
        const countQuery = `SELECT COUNT(*)::int as total FROM ${schema}.drivers${where}`
        const countValues = search ? [`%${search}%`] : []
        const countRes = await pool.query(countQuery, countValues)
        const drivers_total = (countRes.rows?.[0]?.total) ?? 0

        // pass search filter and optional role to v2 function so counts reflect the current filter
        const roleParam = url.searchParams.get('role') || 'fleet_manager'
        const searchParam = search && search.length > 0 ? search : null
        const fleetRes = await pool.query(
            `SELECT * FROM public.get_dashboard_changes_v2($1, $2, $3, $4)`,
            [schema, 7, searchParam, roleParam]
        )
        const fleetChanges = fleetRes.rows?.[0] ?? { fleet_managers_change: 0, total_fleet_managers: 0 }

        // merge into a single changes object for the frontend
        const changes = {
            drivers_change: baseChanges.drivers_change ?? 0,
            employees_change: baseChanges.employees_change ?? 0,
            fleet_managers_change: fleetChanges.fleet_managers_change ?? 0,
            total_fleet_managers: fleetChanges.total_fleet_managers ?? 0,
        }

        // handle export if requested (csv)
        const exportFormat = url.searchParams.get('export') || ''
        if (exportFormat === 'csv') {
            // Build CSV header
            const header = ['id', 'driver_code', 'rating', 'status', 'created_at']
            const rows = drivers.map((r: any) => header.map(h => {
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
                    'Content-Disposition': `attachment; filename="drivers_export_${Date.now()}.csv"`
                }
            })
        }

        return NextResponse.json({ ok: true, metrics, changes, drivers, meta: { total: drivers_total, limit, offset }, fleet_managers_change: changes.fleet_managers_change, total_fleet_managers: changes.total_fleet_managers })
    } catch (err: any) {
        console.error('[api/drivers] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

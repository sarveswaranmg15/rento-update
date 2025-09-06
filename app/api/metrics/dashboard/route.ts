import { NextRequest, NextResponse } from 'next/server'
import pool from '@/db'
import { getTenantSchema } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const qsSchema = url.searchParams.get('schema')
        const subdomain = url.searchParams.get('subdomain') || process.env.NEXT_PUBLIC_TENANT || ''

        function getCookie(name: string) {
            const cookieHeader = req.headers.get('cookie') || ''
            const part = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))
            return part ? decodeURIComponent(part.split('=')[1]) : null
        }
        const cookieSchema = getCookie('tenant_schema')

        function isSafeSchema(s: any) {
            return typeof s === 'string' && /^tenant_[a-z0-9_]+$/.test(s)
        }

        let schema: string | null = null
        if (qsSchema && isSafeSchema(qsSchema)) schema = qsSchema
        else if (cookieSchema && isSafeSchema(cookieSchema)) schema = cookieSchema
        else schema = await getTenantSchema(subdomain)
        if (!schema) {
            return NextResponse.json({ error: 'tenant not found' }, { status: 400 })
        }

        // get counts
        const countsRes = await pool.query(`SELECT * FROM public.get_dashboard_counts($1)`, [schema])
        const tenantsRes = await pool.query(`SELECT * FROM public.get_tenants_list_for_schema($1)`, [schema])

        const counts = countsRes.rows?.[0] ?? { total_drivers: 0, total_employees: 0 }
        const tenants = tenantsRes.rows ?? []

        // attempt to fetch percent change metrics (drivers/employees)
        let changes = { drivers_change: 0, employees_change: 0 }
        try {
            const changesRes = await pool.query(`SELECT * FROM public.get_dashboard_changes($1,$2)`, [schema, 7])
            if (changesRes.rows && changesRes.rows.length > 0) {
                changes = changesRes.rows[0]
            }
        } catch (e) {
            // non-fatal: if the function isn't present or errors, we still return counts/tenants
            console.warn('[api/metrics/dashboard] get_dashboard_changes failed', e)
        }

        // attempt to fetch revenue summary
        let revenue = { total_revenue: 0, recent_revenue: 0, recent_payment_method: null, recent_payment_number: null, recent_payment_date: null }
        try {
            const revRes = await pool.query(`SELECT * FROM public.get_revenue_summary($1,$2)`, [schema, 30])
            if (revRes.rows && revRes.rows.length > 0) {
                revenue = revRes.rows[0]
            }
        } catch (e) {
            console.warn('[api/metrics/dashboard] get_revenue_summary failed', e)
        }

        // attempt to fetch recent payments
        let payments: any[] = []
        try {
            const paymentsRes = await pool.query(`SELECT * FROM public.get_recent_payments($1,$2)`, [schema, 6])
            payments = paymentsRes.rows || []
        } catch (e) {
            console.warn('[api/metrics/dashboard] get_recent_payments failed', e)
        }

        return NextResponse.json({ ok: true, counts, tenants, changes, revenue, payments })
    } catch (err: any) {
        console.error('[api/metrics/dashboard] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

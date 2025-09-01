import { NextRequest, NextResponse } from 'next/server'
import pool from '@/db'

export const runtime = 'nodejs'

type Tenant = { id: string; company_name: string; subdomain: string; schema_name: string; created_at: string }

export async function GET(_req: NextRequest) {
  try {
    // Load active tenants
    const tenantsRes = await pool.query(
      `SELECT id, company_name, subdomain, schema_name, created_at FROM public.tenants WHERE status = 'active'`
    )
    const tenants: Tenant[] = tenantsRes.rows

    let totalUsers = 0
    let totalDrivers = 0
    let totalRevenue = 0
    let totalBookings30d = 0
    const bookingsTrendMap = new Map<string, { total: number; completed: number; cancelled: number }>()
    const statusDist = new Map<string, number>()
    const revenueTrendMap = new Map<string, number>()
    const perTenant: Array<{
      tenantId: string
      name: string
      subdomain: string
      users: number
      drivers: number
      revenue: number
      bookingsToday: number
      bookings30d: number
    }> = []

    for (const t of tenants) {
      const s = t.schema_name
      // Aggregate counts for this tenant
      const countsSql = `
        SELECT
          (SELECT COUNT(*)::int FROM ${s}.users WHERE is_active = true) AS users_count,
          (SELECT COUNT(*)::int FROM ${s}.drivers WHERE is_active = true) AS drivers_count,
          (SELECT COALESCE(SUM(amount),0)::float FROM ${s}.payments WHERE payment_status = 'completed') AS revenue,
          (SELECT COUNT(*)::int FROM ${s}.bookings WHERE DATE(created_at) = CURRENT_DATE) AS bookings_today,
          (SELECT COUNT(*)::int FROM ${s}.bookings WHERE created_at >= NOW() - INTERVAL '30 days') AS bookings_30d
      `
      const counts = await pool.query(countsSql)
      const c = counts.rows[0] || {}
      const users = c.users_count || 0
      const drivers = c.drivers_count || 0
      const revenue = c.revenue || 0
      const bookingsToday = c.bookings_today || 0
      const bookings30d = c.bookings_30d || 0
      totalUsers += users
      totalDrivers += drivers
      totalRevenue += revenue
      totalBookings30d += bookings30d
      perTenant.push({ tenantId: t.id, name: t.company_name, subdomain: t.subdomain, users, drivers, revenue, bookingsToday, bookings30d })

      // Bookings trend last 30 days for this tenant
      const trendSql = `
        SELECT DATE(created_at) AS d,
               COUNT(*)::int AS total,
               SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::int AS completed,
               SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)::int AS cancelled
        FROM ${s}.bookings
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY 1
        ORDER BY 1 ASC
      `
      const trend = await pool.query(trendSql)
      for (const row of trend.rows) {
        const d = row.d.toISOString().slice(0, 10)
        const entry = bookingsTrendMap.get(d) || { total: 0, completed: 0, cancelled: 0 }
        entry.total += row.total
        entry.completed += row.completed
        entry.cancelled += row.cancelled
        bookingsTrendMap.set(d, entry)
      }

      // Booking status distribution (last 30 days)
      const statusSql = `
        SELECT status, COUNT(*)::int AS cnt
        FROM ${s}.bookings
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY status
      `
      const st = await pool.query(statusSql)
      for (const r of st.rows) {
        const k = r.status || 'unknown'
        statusDist.set(k, (statusDist.get(k) || 0) + (r.cnt || 0))
      }

      // Revenue trend (last 30 days)
      const revSql = `
        SELECT DATE(COALESCE(payment_date, created_at)) AS d, COALESCE(SUM(amount),0)::float AS amt
        FROM ${s}.payments
        WHERE payment_status = 'completed' AND COALESCE(payment_date, created_at) >= NOW() - INTERVAL '30 days'
        GROUP BY 1
        ORDER BY 1 ASC
      `
      const rev = await pool.query(revSql)
      for (const r of rev.rows) {
        const d = r.d.toISOString().slice(0, 10)
        revenueTrendMap.set(d, (revenueTrendMap.get(d) || 0) + (r.amt || 0))
      }
    }

    const bookingsTrend = Array.from(bookingsTrendMap.entries())
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const statusDistribution = Array.from(statusDist.entries()).map(([status, count]) => ({ status, count }))
    const revenueTrend = Array.from(revenueTrendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
  tenants: tenants.map(t => ({ id: t.id, name: t.company_name, subdomain: t.subdomain, created_at: t.created_at })),
  perTenant,
  totals: { users: totalUsers, drivers: totalDrivers, revenue: totalRevenue, bookings30d: totalBookings30d },
  trends: { bookings: bookingsTrend, revenue: revenueTrend },
  distribution: { bookingStatus: statusDistribution },
    })
  } catch (err: any) {
    console.error('[analytics/overview] error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

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

        // Get tenant display name if available (tenants table uses company_name)
        const tenantRes = await pool.query('SELECT company_name FROM public.tenants WHERE schema_name = $1 LIMIT 1', [schema])
        const tenantName = tenantRes.rows?.[0]?.company_name || null
        // Parse optional filters from query string
        const search = url.searchParams.get('search')?.trim() || null
        const isActiveParam = url.searchParams.get('is_active') // 'true' | 'false' | null
        const limit = Number(url.searchParams.get('limit') || '25')
        const offset = Number(url.searchParams.get('offset') || '0')
        const sort = url.searchParams.get('sort') || 'created_at'
        const dir = url.searchParams.get('dir') || 'desc'

        // Build parameterized query to safely apply filters
        const whereClauses: string[] = []
        const params: any[] = []
        let idx = 1

        if (search) {
            // match against employee_id, first_name, last_name and email
            whereClauses.push(`(employee_id::text ILIKE $${idx} OR first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR email ILIKE $${idx})`)
            params.push(`%${search}%`)
            idx++
        }

        if (isActiveParam === 'true' || isActiveParam === 'false') {
            whereClauses.push(`is_active = $${idx}`)
            params.push(isActiveParam === 'true')
            idx++
        }

        const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

        // Fetch recent users via helper SQL function which applies filters
        // Convert isActiveParam ('true'|'false') to boolean or null
        const isActiveBool = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : null
        const usersRes = await pool.query('SELECT * FROM public.get_admin_members($1, $2, $3, $4, $5, $6, $7)', [schema, search, isActiveBool, limit, offset, sort, dir])
        const users = usersRes.rows || []
        const meta = { limit, offset }
        const members = users.map((u: any) => ({
            id: u.id,
            employee_id: u.employee_id,
            name: `${(u.first_name || '').trim()} ${(u.last_name || '').trim()}`.trim() || null,
            phone: u.phone,
            email: u.email,
            is_active: u.is_active
        }))

        return NextResponse.json({ ok: true, members, tenantName, meta })
    } catch (err: any) {
        console.error('[api/admin/members] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

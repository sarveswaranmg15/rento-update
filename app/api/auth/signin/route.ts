import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/db'
import { getTenantSchema } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, subdomain } = body || {}
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const schema = await getTenantSchema(subdomain)
    if (!schema) {
      return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
    }

    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email, password_hash FROM ${schema}.users WHERE email = $1 AND is_active = true`,
      [email]
    )

    if (!rows.length) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = rows[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Minimal session placeholder (client can store in memory/localStorage)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    // Update last_login
    await pool.query(`UPDATE ${schema}.users SET last_login = NOW() WHERE id = $1`, [user.id])

    // Fetch user context: role, permissions and tenant info from DB function
    try {
      const ctxRes = await pool.query(`SELECT * FROM public.get_user_context($1, $2)`, [schema, email])
      const ctx = ctxRes.rows && ctxRes.rows[0]

      const userContext = ctx
        ? {
          id: ctx.user_id,
          firstName: ctx.first_name,
          lastName: ctx.last_name,
          email: ctx.email,
          role: ctx.role_name,
          permissions: ctx.permissions || [],
          tenant: {
            id: ctx.tenant_id,
            companyName: ctx.company_name,
            subdomain: ctx.subdomain,
            schemaName: ctx.schema_name
          }
        }
        : { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email }

      return NextResponse.json({ ok: true, token, user: userContext })
    } catch (ctxErr: any) {
      console.error('user context fetch error', ctxErr)
      // Return basic user info if context fetch fails
      return NextResponse.json({ ok: true, token, user: { id: user.id, name: `${user.first_name} ${user.last_name}`.trim(), email: user.email } })
    }
  } catch (err: any) {
    console.error('signin error', err)
    return NextResponse.json({ error: 'Signin failed' }, { status: 500 })
  }
}

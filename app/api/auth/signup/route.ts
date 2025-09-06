import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/db'
import { getTenantSchema } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, firstName, lastName, phone, employeeId, subdomain, schema: schemaFromBody, role = 'employee' } = body || {}

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Prefer explicit schema from body; fallback to subdomain resolution
    let schema = typeof schemaFromBody === 'string' && /^[a-z0-9_]+$/.test(schemaFromBody) ? schemaFromBody : null
    if (!schema) {
      schema = await getTenantSchema(subdomain)
    }
    if (!schema) return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

    // Check if user exists
    const existing = await pool.query(`SELECT 1 FROM ${schema}.users WHERE email = $1`, [email])
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Use create_user(p_schema_name, p_employee_id, p_first_name, p_last_name, p_email, p_phone, p_password_hash, p_role_name, ...)
    try {
      const { rows } = await pool.query(
        `SELECT create_user($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) AS id`,
        [
          schema,
          employeeId || null,
          firstName || email.split('@')[0],
          lastName || '',
          email,
          phone || null,
          passwordHash,
          role,
          null,
          null,
          null,
        ]
      )
      return NextResponse.json({ ok: true, userId: rows?.[0]?.id })
    } catch (e: any) {
      // Fallback: insert directly if function not present
      const roleRow = await pool.query(`SELECT id FROM public.roles WHERE name = $1`, [role])
      const roleId = roleRow.rows?.[0]?.id || null
      const ins = await pool.query(
        `INSERT INTO ${schema}.users (employee_id, first_name, last_name, email, phone, password_hash, role_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [employeeId || null, firstName || email.split('@')[0], lastName || '', email, phone || null, passwordHash, roleId]
      )
      return NextResponse.json({ ok: true, userId: ins.rows?.[0]?.id })
    }
  } catch (err: any) {
    console.error('signup error', err)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}

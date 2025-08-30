import { NextRequest, NextResponse } from 'next/server'
import pool from '@/db'
import bcrypt from 'bcryptjs'
import { getTenantSchema } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const subdomain = process.env.NEXT_PUBLIC_TENANT || 'sampletenant'
  const schema = await getTenantSchema(subdomain)
  if (!schema) {
    return NextResponse.json({ error: `Tenant not found for subdomain ${subdomain}` }, { status: 400 })
  }

  const email = 'tester@rento.local'
  const password = 'Test@1234' // dev-only
  const firstName = 'Test'
  const lastName = 'User'

  try {
    // Ensure role id
    const roleRes = await pool.query(`SELECT id FROM public.roles WHERE name = 'employee' LIMIT 1`)
    const roleId = roleRes.rows?.[0]?.id || null

    // Upsert user
    const existing = await pool.query(`SELECT id FROM ${schema}.users WHERE email = $1`, [email])
    const passwordHash = await bcrypt.hash(password, 10)
    let userId: string

    if (existing.rowCount && existing.rowCount > 0) {
      const id = existing.rows[0].id
      await pool.query(`UPDATE ${schema}.users SET password_hash = $1, is_active = true WHERE id = $2`, [passwordHash, id])
      userId = id
    } else {
      const ins = await pool.query(
        `INSERT INTO ${schema}.users (first_name, last_name, email, password_hash, role_id, is_active)
         VALUES ($1,$2,$3,$4,$5,true) RETURNING id`,
        [firstName, lastName, email, passwordHash, roleId]
      )
      userId = ins.rows[0].id
    }

    return NextResponse.json({ ok: true, userId, email, password })
  } catch (err: any) {
    console.error('[dev/seed] error:', err)
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 })
  }
}

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

    return NextResponse.json({ ok: true, token, user: { id: user.id, name: `${user.first_name} ${user.last_name}`.trim(), email: user.email } })
  } catch (err: any) {
    console.error('signin error', err)
    return NextResponse.json({ error: 'Signin failed' }, { status: 500 })
  }
}

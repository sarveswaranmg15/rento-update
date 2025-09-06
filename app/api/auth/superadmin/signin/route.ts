import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = body || {}
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        // Use DB function to fetch super admin by email (no raw table queries)
        const { rows } = await pool.query(`SELECT * FROM public.get_super_admin_by_email($1)`, [email])

        if (!rows.length) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const user = rows[0]
        if (user.is_active === false) {
            return NextResponse.json({ error: 'Account disabled' }, { status: 403 })
        }

        const ok = await bcrypt.compare(password, user.password_hash)
        if (!ok) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const token = Buffer.from(`${user.id}:${Date.now()}:super`).toString('base64')

        const res = NextResponse.json({
            ok: true,
            token,
            user: {
                id: user.id,
                firstName: user.name,
                lastName: '',
                email: user.email,
                role: 'super_admin'
            }
        })
        try {
            res.cookies.set('tenant_schema', '', { httpOnly: false, sameSite: 'lax', path: '/' }) // clear tenant context
            res.cookies.set('super_admin', '1', { httpOnly: false, sameSite: 'lax', path: '/' })
        } catch { }
        return res
    } catch (err: any) {
        console.error('superadmin signin error', err)
        return NextResponse.json({ error: 'Signin failed' }, { status: 500 })
    }
}

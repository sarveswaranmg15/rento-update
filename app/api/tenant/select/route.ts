import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const schema = (url.searchParams.get('schema') || '').trim()
    const headers = new Headers({ 'Content-Type': 'application/json' })
    if (schema) {
        headers.append('Set-Cookie', `tenant_schema=${encodeURIComponent(schema)}; Path=/; SameSite=Lax`)
        return new Response(JSON.stringify({ ok: true, schema }), { status: 200, headers })
    } else {
        headers.append('Set-Cookie', `tenant_schema=; Path=/; Max-Age=0; SameSite=Lax`)
        return new Response(JSON.stringify({ ok: true, cleared: true }), { status: 200, headers })
    }
}

export async function POST(req: NextRequest) {
    // Mirror GET behavior for convenience
    return GET(req)
}

import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData()
        const file = form.get('file') as File | null
        if (!file) return new Response(JSON.stringify({ ok: false, error: 'file required' }), { status: 400 })

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
        await fs.mkdir(uploadDir, { recursive: true })

        const origName = (file as any).name || 'avatar'
        const ext = path.extname(origName) || (file.type ? ('.' + file.type.split('/')[1]) : '') || '.png'
        const base = path.basename(origName, path.extname(origName)).replace(/[^a-zA-Z0-9_-]/g, '') || 'avatar'
        const filename = `${base}-${Date.now()}` + ext
        const filepath = path.join(uploadDir, filename)

        await fs.writeFile(filepath, buffer)

        const url = `/uploads/avatars/${filename}`
        // Include a base64 data URL so the client can persist the image into DB if desired
        const mime = (file as any).type || 'image/png'
        const image_base64 = `data:${mime};base64,${buffer.toString('base64')}`
        return new Response(JSON.stringify({ ok: true, url, image_base64 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (e: any) {
        console.error('avatar upload error', e)
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 })
    }
}

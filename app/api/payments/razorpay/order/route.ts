import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const amountRupees = Number(body?.amount)
    const currency = (body?.currency || 'INR') as 'INR'
    const receipt = body?.receipt || `rcpt_${Date.now()}`
    const notes = typeof body?.notes === 'object' ? body.notes : undefined

    if (!amountRupees || amountRupees <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET
    if (!key_id || !key_secret) {
      return NextResponse.json({ error: 'Razorpay keys not configured' }, { status: 500 })
    }

    const instance = new Razorpay({ key_id, key_secret })
    const order = await instance.orders.create({
      amount: Math.round(amountRupees * 100), // paise
      currency,
      receipt,
      notes,
    })

    return NextResponse.json({ ok: true, order })
  } catch (err: any) {
    console.error('[razorpay/order] error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

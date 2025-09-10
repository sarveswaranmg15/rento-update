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

        const status = url.searchParams.get('status') || null
        const search = url.searchParams.get('search') || null
        const driver = url.searchParams.get('driver') || null
        const limit = Number(url.searchParams.get('limit') || 50)
        const offset = Number(url.searchParams.get('offset') || 0)
        const userId = url.searchParams.get('userId') || null

        // Call the DB function defined in db-functions/get_booking_history
        // Explicitly name columns to avoid attribute mapping issues if the function signature changes
        const q = `SELECT id, booking_number, user_name, pickup_location, dropoff_location, scheduled_pickup_time, status, estimated_cost, created_at
                   FROM public.get_booking_history($1,$2,$3,$4,$5,$6)`
        const res = await pool.query(q, [schema, userId, status, search, limit, offset])

        const rows = res.rows || []

        // Map DB result to the frontend expected shape used by bookings page
        const bookings = rows.map((r: any) => ({
            id: r.id,
            bookingNumber: r.booking_number || null,
            pickup: r.pickup_location || '',
            dropoff: r.dropoff_location || '',
            date: r.scheduled_pickup_time || r.created_at || null,
            fare: r.estimated_cost || 0,
            status: r.status || '',
            driver: r.user_name || null,
            carType: null
        }))

        return NextResponse.json({ ok: true, bookings })
    } catch (err: any) {
        console.error('[api/bookings] error', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// Create a new booking (normal ride). This assumes payment has succeeded client-side
// and we are persisting the estimated booking details. For now payment signature
// verification & secure association is deferred.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const {
            subdomain,
            schema: schemaFromBody,
            pickupLocation,
            pickupLatitude,
            pickupLongitude,
            dropoffLocation,
            dropoffLatitude,
            dropoffLongitude,
            passengerCount = 1,
            bookingType = 'normal',
            estimatedCost = null,
            userId = null,
            scheduledPickupTime = null,
            status: statusOverride,
            payment // optional: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
        } = body || {}

        if (!pickupLocation || !dropoffLocation) {
            return NextResponse.json({ error: 'pickupLocation and dropoffLocation are required' }, { status: 400 })
        }

        let schema = typeof schemaFromBody === 'string' && /^[a-z0-9_]+$/.test(schemaFromBody) ? schemaFromBody : null
        if (!schema) {
            schema = await getTenantSchema(subdomain)
        }
        if (!schema) return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

        // Helper to generate a unique-ish booking number. Will retry if collision occurs.
        function genBookingNumber() {
            const ts = Date.now().toString(36).toUpperCase()
            const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
            return `BKG-${ts}-${rand}`
        }

    let bookingNumber = genBookingNumber()
        let attempt = 0
        let inserted: any = null
        const maxAttempts = 5

        while (attempt < maxAttempts) {
            try {
                const status = (typeof statusOverride === 'string' && statusOverride.length <= 30) ? statusOverride : undefined
                if (userId) {
                    const q = `INSERT INTO ${schema}.bookings (
                        booking_number, user_id, booking_type, pickup_location, pickup_latitude, pickup_longitude,
                        dropoff_location, dropoff_latitude, dropoff_longitude, passenger_count, estimated_cost, created_by, status, scheduled_pickup_time
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
                    RETURNING id, booking_number, status, created_at, estimated_cost`;
                    const params = [
                        bookingNumber,
                        userId,
                        bookingType,
                        pickupLocation,
                        pickupLatitude ?? null,
                        pickupLongitude ?? null,
                        dropoffLocation,
                        dropoffLatitude ?? null,
                        dropoffLongitude ?? null,
                        passengerCount,
                        estimatedCost,
                        userId,
                        status,
                        scheduledPickupTime ?? null
                    ]
                    const res = await pool.query(q, params)
                    inserted = res.rows[0]
                } else {
                    const q = `INSERT INTO ${schema}.bookings (
                        booking_number, booking_type, pickup_location, pickup_latitude, pickup_longitude,
                        dropoff_location, dropoff_latitude, dropoff_longitude, passenger_count, estimated_cost, status, scheduled_pickup_time
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
                    RETURNING id, booking_number, status, created_at, estimated_cost`;
                    const params = [
                        bookingNumber,
                        bookingType,
                        pickupLocation,
                        pickupLatitude ?? null,
                        pickupLongitude ?? null,
                        dropoffLocation,
                        dropoffLatitude ?? null,
                        dropoffLongitude ?? null,
                        passengerCount,
                        estimatedCost,
                        status,
                        scheduledPickupTime ?? null
                    ]
                    const res = await pool.query(q, params)
                    inserted = res.rows[0]
                }
                break
            } catch (e: any) {
                // Check for unique violation on booking_number (Postgres code 23505)
                if (e?.code === '23505' && /booking_number/.test(e.detail || '')) {
                    attempt++
                    bookingNumber = genBookingNumber()
                    continue
                }
                throw e
            }
        }

        if (!inserted) {
            return NextResponse.json({ error: 'Failed to create booking after retries' }, { status: 500 })
        }

        // If created as cancelled, also set cancellation_reason and cancelled_at
        if ((statusOverride as string) === 'cancelled') {
            try {
                const upd = await pool.query(`UPDATE ${schema}.bookings SET cancellation_reason = $2, cancelled_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id, booking_number, status, cancellation_reason, cancelled_at, estimated_cost, created_at`, [inserted.id, 'User cancelled from UI'])
                if (upd.rowCount) inserted = upd.rows[0]
            } catch {}
        }

        return NextResponse.json({ ok: true, booking: inserted })
    } catch (err: any) {
        console.error('[api/bookings][POST] error', err)
        return NextResponse.json({ error: err.message || 'Failed to create booking' }, { status: 500 })
    }
}

// PATCH: update booking status (cancel / confirm)
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const { bookingId, action, reason, subdomain, schema: schemaFromBody, orderId, paymentId, signature, amount } = body || {}
        if (!bookingId || typeof bookingId !== 'string') {
            return NextResponse.json({ error: 'bookingId required' }, { status: 400 })
        }
        let schema = typeof schemaFromBody === 'string' && /^[a-z0-9_]+$/.test(schemaFromBody) ? schemaFromBody : null
        if (!schema) schema = await getTenantSchema(subdomain)
        if (!schema) return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

        // helper for payment number
        function genPaymentNumber() {
            return 'PAY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2,6).toUpperCase()
        }

        if (action === 'cancel') {
            const q = `UPDATE ${schema}.bookings SET status = 'cancelled', cancellation_reason = $2, cancelled_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id, booking_number, status, cancellation_reason, cancelled_at, estimated_cost, created_at`
            const res = await pool.query(q, [bookingId, reason || 'User dismissed payment'])
            if (!res.rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
            return NextResponse.json({ ok: true, booking: res.rows[0] })
        }
        if (action === 'confirm') {
            const q = `UPDATE ${schema}.bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1 RETURNING id, booking_number, status, estimated_cost, created_at`
            const res = await pool.query(q, [bookingId])
            if (!res.rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
            return NextResponse.json({ ok: true, booking: res.rows[0] })
        }
        if (action === 'update') {
            // Update quote details
            const {
                pickupLocation,
                pickupLatitude,
                pickupLongitude,
                dropoffLocation,
                dropoffLatitude,
                dropoffLongitude,
                passengerCount,
                estimatedCost
            } = body || {}

            const q = `UPDATE ${schema}.bookings
                       SET pickup_location = COALESCE($2, pickup_location),
                           pickup_latitude = COALESCE($3, pickup_latitude),
                           pickup_longitude = COALESCE($4, pickup_longitude),
                           dropoff_location = COALESCE($5, dropoff_location),
                           dropoff_latitude = COALESCE($6, dropoff_latitude),
                           dropoff_longitude = COALESCE($7, dropoff_longitude),
                           passenger_count = COALESCE($8, passenger_count),
                           estimated_cost = COALESCE($9, estimated_cost),
                           updated_at = NOW()
                       WHERE id = $1
                       RETURNING id, booking_number, status, estimated_cost, created_at`;
            const res = await pool.query(q, [
                bookingId,
                pickupLocation ?? null,
                pickupLatitude ?? null,
                pickupLongitude ?? null,
                dropoffLocation ?? null,
                dropoffLatitude ?? null,
                dropoffLongitude ?? null,
                typeof passengerCount === 'number' ? passengerCount : null,
                typeof estimatedCost === 'number' ? estimatedCost : null,
            ])
            if (!res.rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
            return NextResponse.json({ ok: true, booking: res.rows[0] })
        }
        if (action === 'payment_failed' || action === 'booking_failed') {
            // mark payment_failed but still capture cancellation reason and timestamp for audit
            const upd = await pool.query(
                `UPDATE ${schema}.bookings 
                 SET status = 'payment_failed', cancellation_reason = $2, cancelled_at = NOW(), updated_at = NOW() 
                 WHERE id = $1 
                 RETURNING id, booking_number, status, cancellation_reason, cancelled_at, estimated_cost, created_at`,
                [bookingId, reason || 'User exited payment']
            )
            if (!upd.rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
            // create payment record (failed)
            try {
                const paymentNumber = genPaymentNumber()
                const amt = amount ? Number(amount) : upd.rows[0].estimated_cost
                const meta = { orderId, paymentId, signature, reason: reason || 'User exited payment' }
                const payQ = `INSERT INTO ${schema}.payments (payment_number, booking_id, amount, payment_type, payment_method, payment_status, transaction_id, payment_description, metadata)
                              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                              RETURNING id, payment_number, payment_status, amount, transaction_id, created_at`
                const payRes = await pool.query(payQ, [paymentNumber, bookingId, amt || 0, 'ride_fare', 'razorpay', 'failed', paymentId || null, 'Ride fare payment failed', meta])
                return NextResponse.json({ ok: true, booking: upd.rows[0], payment: payRes.rows[0] })
            } catch (e) {
                console.error('payment_failed record insert error', e)
                return NextResponse.json({ ok: true, booking: upd.rows[0] })
            }
        }
        if (action === 'payment_success') {
            // mark booking as waiting for driver assignment after successful payment
            const upd = await pool.query(`UPDATE ${schema}.bookings SET status = 'waiting_driver', updated_at = NOW() WHERE id = $1 RETURNING id, booking_number, status, estimated_cost, created_at`, [bookingId])
            if (!upd.rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
            try {
                const paymentNumber = genPaymentNumber()
                const amt = amount ? Number(amount) : upd.rows[0].estimated_cost
                const meta = { orderId, paymentId, signature }
                const payQ = `INSERT INTO ${schema}.payments (payment_number, booking_id, amount, payment_type, payment_method, payment_status, transaction_id, payment_description, metadata, payment_date)
                              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
                              RETURNING id, payment_number, payment_status, amount, transaction_id, created_at`
                const payRes = await pool.query(payQ, [paymentNumber, bookingId, amt || 0, 'ride_fare', 'razorpay', 'success', paymentId || null, 'Ride fare payment', meta])
                return NextResponse.json({ ok: true, booking: upd.rows[0], payment: payRes.rows[0] })
            } catch (e) {
                console.error('payment_success record insert error', e)
                return NextResponse.json({ ok: true, booking: upd.rows[0] })
            }
        }
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    } catch (err: any) {
        console.error('[api/bookings][PATCH] error', err)
        return NextResponse.json({ error: err.message || 'Failed to update booking' }, { status: 500 })
    }
}

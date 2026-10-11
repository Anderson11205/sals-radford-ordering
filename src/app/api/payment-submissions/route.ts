import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { notifyStaff, notifyCustomer } from '@/lib/store-utils'
import { getLiveSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Customer submits a bank-transfer reference/receipt for review. Never auto-approves. */
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`payment:${clientIp(req)}`, 10, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: 'Too many submissions. Please wait a minute.' }, { status: 429 })
    }

    const body = await req.json()
    const orderNumber = String(body.orderNumber ?? '').trim().toUpperCase()
    const token = String(body.token ?? '').trim()
    const reference = String(body.reference ?? '').trim().slice(0, 160)
    const amount = body.amount != null ? parseFloat(String(body.amount)) : null
    const note = String(body.note ?? '').trim().slice(0, 400) || null

    if (!orderNumber || !reference) {
      return NextResponse.json({ ok: false, error: 'Enter your payment reference (transaction ID or transfer note).' }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { orderNumber }, include: { payments: true } })
    if (!order) return NextResponse.json({ ok: false, error: 'Order not found.' }, { status: 404 })

    const session = await getLiveSession()
    const authorized = token === order.accessToken || (session && order.userId === session.userId) || session?.role === 'OWNER' || session?.role === 'MANAGER'
    if (!authorized) return NextResponse.json({ ok: false, error: 'Not authorized for this order.' }, { status: 403 })

    if (order.paymentStatus === 'CONFIRMED') {
      return NextResponse.json({ ok: false, error: 'Payment for this order has already been confirmed. No further submissions needed.' }, { status: 400 })
    }
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      return NextResponse.json({ ok: false, error: 'This order is set to pay on pickup/delivery — no transfer submission is needed.' }, { status: 400 })
    }
    // Prevent duplicate references
    if (order.payments.some((p) => p.reference === reference && p.status !== 'REJECTED')) {
      return NextResponse.json({ ok: false, error: 'This payment reference was already submitted and is under review.' }, { status: 400 })
    }

    const submission = await db.paymentSubmission.create({
      data: {
        orderId: order.id,
        method: 'BANK_TRANSFER',
        reference,
        amount: amount != null && Number.isFinite(amount) && amount > 0 ? amount : null,
        note,
        status: 'UNDER_REVIEW',
      },
    })

    await db.order.update({ where: { id: order.id }, data: { paymentStatus: 'UNDER_REVIEW', status: 'PAYMENT_UNDER_REVIEW' } })

    await notifyStaff('Payment submitted for review', `Order ${orderNumber}: reference "${reference}" — awaiting verification.`, order.id)
    await notifyCustomer(
      order.userId,
      'Payment under review',
      `Thank you for ordering from Sal's! Your payment reference for order ${orderNumber} has been received and is awaiting review by the restaurant.`,
      order.id
    )

    return NextResponse.json({ ok: true, submissionId: submission.id, status: 'UNDER_REVIEW' })
  } catch (e) {
    console.error('payment submission error', e)
    return NextResponse.json({ ok: false, error: 'Could not save your payment submission. Please try again.' }, { status: 500 })
  }
}

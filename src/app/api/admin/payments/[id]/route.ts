import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { notifyCustomer, notifyStaff, audit } from '@/lib/store-utils'

export const dynamic = 'force-dynamic'

/** Verify a payment submission — CONFIRMED or REJECTED, with reviewer identity recorded. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(['OWNER', 'MANAGER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const decision = String(body.decision ?? '')
  const reviewNote = String(body.note ?? '').trim().slice(0, 300) || null

  if (!['CONFIRMED', 'REJECTED'].includes(decision)) {
    return NextResponse.json({ ok: false, error: 'Decision must be CONFIRMED or REJECTED.' }, { status: 400 })
  }

  const payment = await db.paymentSubmission.findUnique({ where: { id }, include: { order: true } })
  if (!payment) return NextResponse.json({ ok: false, error: 'Payment submission not found.' }, { status: 404 })
  if (payment.status !== 'UNDER_REVIEW') {
    return NextResponse.json({ ok: false, error: `This payment was already ${payment.status.toLowerCase()}. Duplicate confirmation is blocked.` }, { status: 400 })
  }

  const order = payment.order

  await db.paymentSubmission.update({
    where: { id },
    data: {
      status: decision,
      reviewedById: session.userId,
      reviewedByName: `${session.name} (${session.email})`,
      reviewedAt: new Date(),
      reviewNote,
    },
  })

  if (decision === 'CONFIRMED') {
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: 'CONFIRMED', status: order.status === 'PREPARING' ? order.status : 'PAYMENT_CONFIRMED' } })
    await notifyCustomer(
      order.userId,
      'Payment confirmed',
      `Great news! Your payment for order ${order.orderNumber} has been verified by the restaurant and the kitchen is getting it ready.`,
      order.id
    )
    await notifyStaff(`Payment confirmed — ${order.orderNumber}`, `${session.name} verified payment reference "${payment.reference}". Order can proceed.`, order.id)
  } else {
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: 'UNDER_REVIEW' } })
    await notifyCustomer(
      order.userId,
      'Payment could not be verified',
      `We could not verify the payment reference submitted for order ${order.orderNumber}. Please check the reference and resubmit, or call us at (540) 639-9669.${reviewNote ? ` Note from the restaurant: ${reviewNote}` : ''}`,
      order.id
    )
  }

  await audit(session.email, `PAYMENT_${decision}`, 'PAYMENT', id, `Order ${order.orderNumber} ref "${payment.reference}"`)

  return NextResponse.json({ ok: true })
}

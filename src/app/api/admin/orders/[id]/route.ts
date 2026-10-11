import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { notifyCustomer, notifyStaff, audit } from '@/lib/store-utils'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = [
  'AWAITING_PAYMENT',
  'PAYMENT_UNDER_REVIEW',
  'PAYMENT_CONFIRMED',
  'ORDER_RECEIVED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED',
]

const CUSTOMER_MESSAGES: Record<string, { title: string; body: string }> = {
  PAYMENT_CONFIRMED: {
    title: 'Payment confirmed',
    body: "Great news! Your payment has been verified and the kitchen is getting your order ready. Thank you for ordering from Sal's!",
  },
  ORDER_RECEIVED: {
    title: 'Order received',
    body: "Thank you for ordering from Sal's! Your order has been received and the kitchen will begin preparing it shortly.",
  },
  PREPARING: {
    title: 'Your order is being prepared',
    body: "Good news — the kitchen is now preparing your order. We'll let you know as soon as it's ready!",
  },
  READY_FOR_PICKUP: {
    title: 'Ready for pickup',
    body: "Your order is ready for pickup at Sal's Italian Restaurant & Pizzeria, 709 West Main Street, Radford. See you soon!",
  },
  OUT_FOR_DELIVERY: {
    title: 'Out for delivery',
    body: "Your order is on its way! Our driver is heading to your address. Please be ready to receive your food. Grazie!",
  },
  COMPLETED: {
    title: 'Order completed',
    body: "Your order is complete. Thank you for ordering from Sal's Italian Restaurant & Pizzeria — we hope to see you again soon!",
  },
  CANCELLED: {
    title: 'Order cancelled',
    body: "Your order has been cancelled. If you did not request this, please call us at (540) 639-9669.",
  },
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(['OWNER', 'MANAGER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, payments: { orderBy: { submittedAt: 'desc' } } },
  })
  if (!order) return NextResponse.json({ ok: false, error: 'Order not found.' }, { status: 404 })
  return NextResponse.json({ ok: true, order })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(['OWNER', 'MANAGER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const status = String(body.status ?? '')

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 })
  }

  const order = await db.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ ok: false, error: 'Order not found.' }, { status: 404 })

  // Business rules: delivery orders never show pickup-only statuses and vice versa
  if (order.fulfillment === 'PICKUP' && status === 'OUT_FOR_DELIVERY') {
    return NextResponse.json({ ok: false, error: '"Out for delivery" only applies to delivery orders.' }, { status: 400 })
  }

  const data: Record<string, string> = { status }
  // Moving forward in the kitchen flow implies payment settled for pay-on-site orders
  if (order.paymentMethod === 'PAY_ON_SITE' && ['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED'].includes(status)) {
    data.paymentStatus = 'CONFIRMED'
  }
  if (status === 'CANCELLED' && order.paymentStatus === 'UNDER_REVIEW') {
    data.paymentStatus = 'UNPAID'
  }

  const updated = await db.order.update({ where: { id }, data })

  const msg = CUSTOMER_MESSAGES[status]
  if (msg) {
    await notifyCustomer(order.userId, msg.title, `${msg.body} (Order ${order.orderNumber})`, order.id)
  }
  await audit(session.email, 'ORDER_STATUS_CHANGE', 'ORDER', order.id, `${order.status} → ${status}`)

  return NextResponse.json({ ok: true, status: updated.status, paymentStatus: updated.paymentStatus })
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLiveSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Secure order tracking — requires the order's access token (guests) or an admin session. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await params
    const token = req.nextUrl.searchParams.get('t')

    const order = await db.order.findUnique({
      where: { orderNumber: orderNumber.toUpperCase() },
      include: {
        items: true,
        payments: { orderBy: { submittedAt: 'desc' } },
        notifications: { where: { audience: 'CUSTOMER' }, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found. Check your order number.' }, { status: 404 })
    }

    const session = await getLiveSession()
    const isStaff = session && (session.role === 'OWNER' || session.role === 'MANAGER')
    const isOwner = order.userId && session && order.userId === session.userId

    if (!isStaff && !isOwner && token !== order.accessToken) {
      return NextResponse.json({ ok: false, error: 'Not authorized to view this order.' }, { status: 403 })
    }

    // Customer-visible payload (hide staff internals)
    return NextResponse.json({
      ok: true,
      order: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        fulfillment: order.fulfillment,
        address: order.address,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        deliveryFee: order.deliveryFee,
        total: order.total,
        orderNotes: order.orderNotes,
        allergyNotes: order.allergyNotes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items,
        payments: order.payments.map((p) => ({
          id: p.id,
          method: p.method,
          reference: p.reference,
          status: p.status,
          submittedAt: p.submittedAt,
          reviewedAt: p.reviewedAt,
        })),
        notifications: order.notifications,
      },
    })
  } catch (e) {
    console.error('order GET error', e)
    return NextResponse.json({ ok: false, error: 'Could not load the order. Please try again.' }, { status: 500 })
  }
}

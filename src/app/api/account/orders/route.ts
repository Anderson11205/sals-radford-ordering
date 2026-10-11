import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLiveSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getLiveSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 })

  const orders = await db.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
    take: 50,
  })

  return NextResponse.json({
    ok: true,
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      accessToken: o.accessToken,
      status: o.status,
      paymentStatus: o.paymentStatus,
      fulfillment: o.fulfillment,
      total: o.total,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((a, i) => a + i.quantity, 0),
    })),
  })
}

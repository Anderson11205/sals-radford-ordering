import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await requireRole(['OWNER', 'MANAGER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 })

  const [newOrders, paymentReview, preparing, ready, outForDelivery, completed, cancelled, unreadStaff] = await Promise.all([
    db.order.count({ where: { status: 'ORDER_RECEIVED' } }),
    db.order.count({ where: { status: { in: ['AWAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW'] } } }),
    db.order.count({ where: { status: 'PREPARING' } }),
    db.order.count({ where: { status: 'READY_FOR_PICKUP' } }),
    db.order.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
    db.order.count({ where: { status: 'COMPLETED' } }),
    db.order.count({ where: { status: 'CANCELLED' } }),
    db.notification.count({ where: { audience: 'STAFF', read: false } }),
  ])

  // Sales totals computed from actual confirmed orders only
  const confirmedAgg = await db.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { total: true }, _count: true })
  const completedAgg = await db.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { total: true }, _count: true })

  const recentOrders = await db.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { orderNumber: true, customerName: true, status: true, total: true, fulfillment: true, createdAt: true },
  })

  const menuItemCount = await db.menuItem.count()
  const unavailableCount = await db.menuItem.count({ where: { available: false } })
  const pricePendingCount = await db.menuItem.count({ where: { pricePending: true } })

  return NextResponse.json({
    ok: true,
    stats: {
      newOrders,
      paymentReview,
      preparing,
      ready,
      outForDelivery,
      completed,
      cancelled,
      unreadStaff,
      openTotal: confirmedAgg._sum.total ?? 0,
      openCount: confirmedAgg._count,
      completedTotal: completedAgg._sum.total ?? 0,
      completedCount: completedAgg._count,
      menuItemCount,
      unavailableCount,
      pricePendingCount,
      recentOrders,
    },
  })
}

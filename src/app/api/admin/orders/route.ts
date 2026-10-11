import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await requireRole(['OWNER', 'MANAGER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') ?? ''
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1') || 1)
  const perPage = 15

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (q) {
    where.OR = [
      { orderNumber: { contains: q.toUpperCase() } },
      { customerName: { contains: q } },
      { phone: { contains: q } },
    ]
  }

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { items: { select: { quantity: true } }, payments: { where: { status: 'UNDER_REVIEW' }, select: { id: true } } },
    }),
  ])

  return NextResponse.json({
    ok: true,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      phone: o.phone,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      fulfillment: o.fulfillment,
      total: o.total,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((a, i) => a + i.quantity, 0),
      pendingPayments: o.payments.length,
    })),
  })
}

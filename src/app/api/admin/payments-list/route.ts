import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** All payment submissions needing review (plus recently reviewed for the log). */
export async function GET() {
  const session = await requireRole(['OWNER', 'MANAGER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 })

  const [pending, recent] = await Promise.all([
    db.paymentSubmission.findMany({
      where: { status: 'UNDER_REVIEW' },
      orderBy: { submittedAt: 'asc' },
      include: { order: { select: { orderNumber: true, total: true, customerName: true, phone: true } } },
    }),
    db.paymentSubmission.findMany({
      where: { status: { not: 'UNDER_REVIEW' } },
      orderBy: { reviewedAt: 'desc' },
      take: 15,
      include: { order: { select: { orderNumber: true, total: true, customerName: true, phone: true } } },
    }),
  ])

  return NextResponse.json({
    ok: true,
    payments: pending.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: p.amount,
      note: p.note,
      status: p.status,
      submittedAt: p.submittedAt,
      order: p.order,
    })),
    recent: recent.map((p) => ({
      id: p.id,
      reference: p.reference,
      status: p.status,
      reviewedAt: p.reviewedAt,
      reviewedByName: p.reviewedByName,
      order: p.order,
    })),
  })
}

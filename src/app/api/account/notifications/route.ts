import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLiveSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getLiveSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 })

  const notifications = await db.notification.findMany({
    where: { userId: session.userId, audience: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { order: { select: { orderNumber: true } } },
  })
  return NextResponse.json({ ok: true, notifications })
}

export async function PATCH(req: NextRequest) {
  const session = await getLiveSession()
  if (!session) return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const ids = Array.isArray(body.ids) ? body.ids.slice(0, 100) : null
  if (ids) {
    await db.notification.updateMany({ where: { id: { in: ids }, userId: session.userId }, data: { read: true } })
  } else {
    await db.notification.updateMany({ where: { userId: session.userId, audience: 'CUSTOMER' }, data: { read: true } })
  }
  return NextResponse.json({ ok: true })
}

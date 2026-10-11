import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { audit } from '@/lib/store-utils'

export const dynamic = 'force-dynamic'

/** Suspend / reactivate / remove a manager. Owner-only. Owner accounts cannot be modified here. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(['OWNER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Only the primary owner can manage the team.' }, { status: 403 })

  const { id } = await params
  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 })
  if (target.role === 'OWNER') {
    return NextResponse.json({ ok: false, error: 'Owner accounts cannot be modified from team management.' }, { status: 403 })
  }

  const body = await req.json()
  const action = String(body.action ?? '')

  if (action === 'SUSPEND') {
    await db.user.update({ where: { id }, data: { status: 'SUSPENDED' } })
    await audit(session.email, 'MANAGER_SUSPENDED', 'USER', id, target.email)
  } else if (action === 'ACTIVATE') {
    await db.user.update({ where: { id }, data: { status: 'ACTIVE' } })
    await audit(session.email, 'MANAGER_REACTIVATED', 'USER', id, target.email)
  } else if (action === 'REMOVE') {
    const orderCount = await db.order.count({ where: { userId: id } })
    if (orderCount > 0) {
      // Preserve order history integrity — suspend instead of delete
      await db.user.update({ where: { id }, data: { status: 'SUSPENDED' } })
      await audit(session.email, 'MANAGER_SUSPENDED', 'USER', id, `${target.email} (has order history; suspended instead of deleted)`)
      return NextResponse.json({ ok: true, note: 'This manager has order history, so they were suspended instead of deleted to preserve records.' })
    }
    await db.user.delete({ where: { id } })
    await audit(session.email, 'MANAGER_REMOVED', 'USER', id, target.email)
  } else {
    return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

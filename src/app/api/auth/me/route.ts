import { NextResponse } from 'next/server'
import { getLiveSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getLiveSession()
  if (!session) return NextResponse.json({ ok: true, user: null })
  const unread = await db.notification.count({ where: { userId: session.userId, audience: 'CUSTOMER', read: false } })
  return NextResponse.json({ ok: true, user: session, unreadNotifications: unread })
}

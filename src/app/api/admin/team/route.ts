import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { audit } from '@/lib/store-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await requireRole(['OWNER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Only the primary owner can manage the team.' }, { status: 403 })

  const users = await db.user.findMany({
    where: { role: { in: ['MANAGER', 'OWNER'] } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  })
  return NextResponse.json({ ok: true, users })
}

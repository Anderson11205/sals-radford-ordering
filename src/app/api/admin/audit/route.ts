import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await requireRole(['OWNER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Only the primary owner can view audit logs.' }, { status: 403 })

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1') || 1)
  const perPage = 30
  const [total, logs] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
  ])

  return NextResponse.json({ ok: true, total, page, pages: Math.max(1, Math.ceil(total / perPage)), logs })
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { audit } from '@/lib/store-utils'
import { generateToken } from '@/lib/store-utils'

export const dynamic = 'force-dynamic'

/** Revoke an invitation, or resend (= revoke old + issue a fresh link). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(['OWNER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Only the primary owner can manage invitations.' }, { status: 403 })

  const { id } = await params
  const invitation = await db.invitation.findUnique({ where: { id } })
  if (!invitation) return NextResponse.json({ ok: false, error: 'Invitation not found.' }, { status: 404 })

  const body = await req.json()
  const action = String(body.action ?? '')

  if (action === 'REVOKE') {
    await db.invitation.update({ where: { id }, data: { revokedAt: new Date() } })
    await audit(session.email, 'INVITATION_REVOKED', 'INVITATION', id, invitation.email)
    return NextResponse.json({ ok: true })
  }

  if (action === 'RESEND') {
    await db.invitation.update({ where: { id }, data: { revokedAt: new Date() } })
    const hoursSetting = await db.setting.findUnique({ where: { key: 'inviteExpiryHours' } })
    const hours = Math.min(168, Math.max(1, parseInt(hoursSetting?.value ?? '72') || 72))
    const token = generateToken(24)
    const fresh = await db.invitation.create({
      data: { token, email: invitation.email, role: invitation.role, expiresAt: new Date(Date.now() + hours * 3600_000), createdBy: session.email },
    })
    await audit(session.email, 'INVITATION_RESENT', 'INVITATION', fresh.id, invitation.email)
    const origin = req.headers.get('origin') ?? ''
    return NextResponse.json({ ok: true, link: `${origin}/invite/${token}` })
  }

  return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 })
}

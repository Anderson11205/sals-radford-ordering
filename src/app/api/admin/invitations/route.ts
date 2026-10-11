import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { generateToken, audit } from '@/lib/store-utils'

export const dynamic = 'force-dynamic'

function baseUrl(req: { headers: { get(k: string): string | null } }): string {
  const proto = req.headers.get('x-forwarded-proto') ?? 'http'
  const host = req.headers.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

export async function GET() {
  const session = await requireRole(['OWNER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Only the primary owner can manage invitations.' }, { status: 403 })

  const invitations = await db.invitation.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    ok: true,
    invitations: invitations.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
      usedAt: i.usedAt,
      revokedAt: i.revokedAt,
      createdAt: i.createdAt,
      link: `${baseUrl(new Request('http://x'))}/invite/${i.token}`.replace('http://x', ''),
      token: i.token,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(['OWNER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Only the primary owner can create invitations.' }, { status: 403 })

  const body = await req.json()
  const email = String(body.email ?? '').trim().toLowerCase()
  const role = body.role === 'OWNER' ? 'OWNER' : 'MANAGER'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 })
  }
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ ok: false, error: 'A user with this email already exists.' }, { status: 409 })
  }

  const hoursSetting = await db.setting.findUnique({ where: { key: 'inviteExpiryHours' } })
  const hours = Math.min(168, Math.max(1, parseInt(hoursSetting?.value ?? '72') || 72))

  // Invalidate previous pending invitations for the same email
  await db.invitation.updateMany({ where: { email, usedAt: null, revokedAt: null }, data: { revokedAt: new Date() } })

  const token = generateToken(24)
  const invitation = await db.invitation.create({
    data: { token, email, role, expiresAt: new Date(Date.now() + hours * 3600_000), createdBy: session.email },
  })

  await audit(session.email, 'INVITATION_CREATED', 'INVITATION', invitation.id, `${role} invite for ${email}, expires in ${hours}h`)

  const origin = req.headers.get('origin') ?? baseUrl(req)
  return NextResponse.json({
    ok: true,
    invitation: { id: invitation.id, email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt },
    link: `${origin}/invite/${token}`,
  })
}

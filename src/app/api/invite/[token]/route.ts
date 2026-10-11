import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'
import { audit } from '@/lib/store-utils'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Validate a manager invitation link (single-use, expiring). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invitation = await db.invitation.findUnique({ where: { token } })
  if (!invitation || invitation.usedAt || invitation.revokedAt || invitation.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: 'This invitation link is invalid, expired, or has already been used.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, email: invitation.email, role: invitation.role })
}

/** Accept the invitation and create the manager account. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const rl = rateLimit(`invite:${clientIp(req)}`, 5, 300_000)
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: 'Too many attempts. Please wait 5 minutes.' }, { status: 429 })
    }

    const { token } = await params
    const invitation = await db.invitation.findUnique({ where: { token } })
    if (!invitation || invitation.usedAt || invitation.revokedAt || invitation.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, error: 'This invitation link is invalid, expired, or has already been used.' }, { status: 404 })
    }

    const body = await req.json()
    const name = String(body.name ?? '').trim().slice(0, 80)
    const phone = String(body.phone ?? '').trim().slice(0, 25) || null
    const password = String(body.password ?? '')

    if (name.length < 2) return NextResponse.json({ ok: false, error: 'Please enter your name.' }, { status: 400 })
    if (password.length < 10) return NextResponse.json({ ok: false, error: 'Password must be at least 10 characters.' }, { status: 400 })

    const existing = await db.user.findUnique({ where: { email: invitation.email } })
    if (existing) {
      return NextResponse.json({ ok: false, error: 'An account with this email already exists. The owner should remove it first.' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        name,
        email: invitation.email,
        phone,
        passwordHash: await hashPassword(password),
        role: invitation.role === 'OWNER' ? 'OWNER' : 'MANAGER',
      },
    })

    await db.invitation.update({ where: { id: invitation.id }, data: { usedAt: new Date() } })
    await audit(invitation.email, 'INVITATION_ACCEPTED', 'USER', user.id, `Role: ${user.role}`)
    await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role as 'MANAGER' | 'OWNER' })

    return NextResponse.json({ ok: true, role: user.role })
  } catch (e) {
    console.error('invite accept error', e)
    return NextResponse.json({ ok: false, error: 'Could not accept the invitation. Please try again.' }, { status: 500 })
  }
}

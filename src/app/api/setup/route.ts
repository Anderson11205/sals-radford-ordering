import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession, OWNER_EMAIL } from '@/lib/auth'
import { audit } from '@/lib/store-utils'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * One-time secure owner setup. Allowed ONLY when no user exists yet, and the
 * email must match the configured primary owner email. No hardcoded passwords.
 */
export async function GET() {
  const ownerCount = await db.user.count({ where: { role: 'OWNER' } })
  return NextResponse.json({ ok: true, setupAvailable: ownerCount === 0, ownerEmail: OWNER_EMAIL })
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`setup:${clientIp(req)}`, 5, 300_000)
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: 'Too many attempts. Please wait 5 minutes.' }, { status: 429 })
    }

    const ownerCount = await db.user.count({ where: { role: 'OWNER' } })
    if (ownerCount > 0) {
      return NextResponse.json({ ok: false, error: 'Setup is already complete. Sign in with your owner account.' }, { status: 403 })
    }

    const body = await req.json()
    const name = String(body.name ?? '').trim().slice(0, 80)
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (email !== OWNER_EMAIL.toLowerCase()) {
      return NextResponse.json({ ok: false, error: `The first owner account must be created with the primary owner email (${OWNER_EMAIL}).` }, { status: 403 })
    }
    if (name.length < 2) return NextResponse.json({ ok: false, error: 'Please enter your name.' }, { status: 400 })
    if (password.length < 10) return NextResponse.json({ ok: false, error: 'Owner password must be at least 10 characters.' }, { status: 400 })

    const passwordHash = await hashPassword(password)
    const user = await db.user.create({ data: { name, email, passwordHash, role: 'OWNER' } })

    await audit(email, 'OWNER_SETUP', 'USER', user.id, 'Primary owner account created')
    await createSession({ userId: user.id, email: user.email, name: user.name, role: 'OWNER' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('setup error', e)
    return NextResponse.json({ ok: false, error: 'Setup failed. Please try again.' }, { status: 500 })
  }
}

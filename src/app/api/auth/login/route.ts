import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`login:${clientIp(req)}`, 8, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: 'Too many sign-in attempts. Please wait a minute and try again.' }, { status: 429 })
    }

    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Enter your email and password.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ ok: false, error: 'Incorrect email or password.' }, { status: 401 })
    }
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ ok: false, error: 'This account has been suspended. Contact the restaurant.' }, { status: 403 })
    }

    await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role as 'CUSTOMER' | 'MANAGER' | 'OWNER' })
    return NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role } })
  } catch (e) {
    console.error('login error', e)
    return NextResponse.json({ ok: false, error: 'Sign-in failed. Please try again.' }, { status: 500 })
  }
}

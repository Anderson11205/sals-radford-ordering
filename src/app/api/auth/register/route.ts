import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`register:${clientIp(req)}`, 5, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: 'Too many registration attempts. Please wait a minute.' }, { status: 429 })
    }

    const body = await req.json()
    const name = String(body.name ?? '').trim().slice(0, 80)
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 120)
    const phone = String(body.phone ?? '').trim().slice(0, 25) || null
    const password = String(body.password ?? '')

    if (name.length < 2) return NextResponse.json({ ok: false, error: 'Please enter your name.' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters.' }, { status: 400 })
    if (password.length > 100) return NextResponse.json({ ok: false, error: 'Password is too long.' }, { status: 400 })

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ ok: false, error: 'An account with this email already exists. Please sign in instead.' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: { name, email, phone, passwordHash, role: 'CUSTOMER' },
    })

    await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role as 'CUSTOMER' })
    return NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role } })
  } catch (e) {
    console.error('register error', e)
    return NextResponse.json({ ok: false, error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Look up an order by number + phone (last 4 digits + full number match). Returns a tracking link token. */
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`lookup:${clientIp(req)}`, 10, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: 'Too many lookup attempts. Please wait a minute.' }, { status: 429 })
    }

    const body = await req.json()
    const orderNumber = String(body.orderNumber ?? '').trim().toUpperCase()
    const phone = String(body.phone ?? '').replace(/\D/g, '')

    if (!orderNumber || phone.length < 4) {
      return NextResponse.json({ ok: false, error: 'Enter your order number and the phone number used for the order.' }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { orderNumber } })
    if (!order || order.phone.replace(/\D/g, '') !== phone) {
      return NextResponse.json({ ok: false, error: 'No order matches that order number and phone number.' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, accessToken: order.accessToken })
  } catch (e) {
    console.error('lookup error', e)
    return NextResponse.json({ ok: false, error: 'Lookup failed. Please try again.' }, { status: 500 })
  }
}

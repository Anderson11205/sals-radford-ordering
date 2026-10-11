import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLiveSession } from '@/lib/auth'
import { priceCart, CartLineInput } from '@/lib/pricing'
import { getSettings, notifyStaff, notifyCustomer, generateOrderNumber, generateToken, audit } from '@/lib/store-utils'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface CreateOrderBody {
  idempotencyKey?: string
  lines?: CartLineInput[]
  customerName?: string
  phone?: string
  email?: string
  fulfillment?: 'PICKUP' | 'DELIVERY'
  address?: string
  orderNotes?: string
  allergyNotes?: string
  paymentMethod?: 'PAY_ON_SITE' | 'BANK_TRANSFER'
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`order:${clientIp(req)}`, 10, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: 'Too many order attempts. Please wait a moment and try again.' }, { status: 429 })
    }

    const body = (await req.json()) as CreateOrderBody
    const idempotencyKey = typeof body.idempotencyKey === 'string' && body.idempotencyKey.length <= 64 ? body.idempotencyKey : null
    if (!idempotencyKey) {
      return NextResponse.json({ ok: false, error: 'Missing order reference. Please refresh and try again.' }, { status: 400 })
    }

    // Duplicate submission protection (double-tap / retry after network failure)
    const existing = await db.order.findUnique({
      where: { idempotencyKey },
      select: { orderNumber: true, accessToken: true },
    })
    if (existing) {
      return NextResponse.json({ ok: true, orderNumber: existing.orderNumber, accessToken: existing.accessToken, duplicate: true })
    }

    const session = await getLiveSession()

    const customerName = (body.customerName ?? '').trim().slice(0, 80)
    const phoneRaw = (body.phone ?? '').trim()
    const email = (body.email ?? '').trim().toLowerCase().slice(0, 120) || null
    const fulfillment = body.fulfillment === 'DELIVERY' ? 'DELIVERY' : 'PICKUP'
    const address = (body.address ?? '').trim().slice(0, 250) || null
    const orderNotes = (body.orderNotes ?? '').trim().slice(0, 500) || null
    const allergyNotes = (body.allergyNotes ?? '').trim().slice(0, 500) || null
    const paymentMethod = body.paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'PAY_ON_SITE'

    // Validation
    if (customerName.length < 2) return NextResponse.json({ ok: false, error: 'Please enter your name.' }, { status: 400 })
    const digits = phoneRaw.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) {
      return NextResponse.json({ ok: false, error: 'Please enter a valid phone number (10+ digits).' }, { status: 400 })
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (fulfillment === 'DELIVERY' && (!address || address.length < 10)) {
      return NextResponse.json({ ok: false, error: 'Please enter your full delivery address.' }, { status: 400 })
    }

    const settings = await getSettings()
    if (fulfillment === 'DELIVERY' && settings.deliveryEnabled !== 'true') {
      return NextResponse.json({ ok: false, error: 'Delivery is not available yet. Please choose pickup.' }, { status: 400 })
    }
    if (paymentMethod === 'BANK_TRANSFER' && settings.bankTransferEnabled !== 'true') {
      return NextResponse.json({ ok: false, error: 'Bank transfer payment is not available yet. Please pay at pickup.' }, { status: 400 })
    }

    // Authoritative server-side pricing
    const { cart, error } = await priceCart(body.lines ?? [], fulfillment)
    if (!cart) return NextResponse.json({ ok: false, error }, { status: 400 })

    // Initial status depends on payment method
    const status = paymentMethod === 'BANK_TRANSFER' ? 'AWAITING_PAYMENT' : 'ORDER_RECEIVED'
    const paymentStatus = paymentMethod === 'BANK_TRANSFER' ? 'UNPAID' : 'PAY_ON_SITE'

    const orderNumber = generateOrderNumber()
    const accessToken = generateToken()

    const order = await db.order.create({
      data: {
        orderNumber,
        accessToken,
        idempotencyKey,
        userId: session?.userId ?? null,
        customerName,
        phone: phoneRaw.slice(0, 25),
        email,
        fulfillment,
        address: fulfillment === 'DELIVERY' ? address : null,
        orderNotes,
        allergyNotes,
        status,
        paymentStatus,
        paymentMethod,
        subtotal: cart.subtotal,
        taxRate: cart.taxRate,
        taxAmount: cart.taxAmount,
        deliveryFee: cart.deliveryFee,
        total: cart.total,
        items: {
          create: cart.lines.map((l) => ({
            menuItemId: l.menuItemId,
            name: l.name,
            variantName: l.variantName,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            selections: JSON.stringify(l.selections),
            notes: l.notes,
            lineTotal: l.lineTotal,
          })),
        },
      },
    })

    await audit(session?.email ?? orderNumber, 'ORDER_CREATED', 'ORDER', order.id, `${fulfillment} ${cart.total.toFixed(2)}`)
    await notifyStaff(
      'New order received',
      `Order ${orderNumber} — ${customerName} — ${fulfillment === 'PICKUP' ? 'Pickup' : 'Delivery'} — $${cart.total.toFixed(2)}`,
      order.id
    )
    if (session?.userId) {
      await notifyCustomer(
        session.userId,
        'Thank you for ordering from Sal\'s!',
        `Your order ${orderNumber} has been received. ${
          paymentMethod === 'BANK_TRANSFER'
            ? 'It is awaiting payment — submit your transfer reference to begin payment review.'
            : 'The kitchen will begin preparing it shortly.'
        }`,
        order.id
      )
    }

    return NextResponse.json({ ok: true, orderNumber, accessToken })
  } catch (e) {
    console.error('order POST error', e)
    return NextResponse.json({ ok: false, error: 'We could not save your order. Nothing was charged — please try again.' }, { status: 500 })
  }
}

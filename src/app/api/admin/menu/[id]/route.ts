import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { audit } from '@/lib/store-utils'

export const dynamic = 'force-dynamic'

/** Edit a menu item. Price/name/description/availability. Historical order prices are preserved via snapshots. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(['OWNER', 'MANAGER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const item = await db.menuItem.findUnique({ where: { id }, include: { variants: true } })
  if (!item) return NextResponse.json({ ok: false, error: 'Menu item not found.' }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (typeof body.name === 'string' && body.name.trim().length >= 2) data.name = body.name.trim().slice(0, 120)
  if (typeof body.description === 'string') data.description = body.description.trim().slice(0, 600) || null
  if (typeof body.available === 'boolean') data.available = body.available
  if (typeof body.popular === 'boolean') data.popular = body.popular

  if (body.price !== undefined) {
    if (body.price === null || body.price === '') {
      data.basePrice = null
      data.pricePending = true
    } else {
      const price = parseFloat(String(body.price))
      if (!Number.isFinite(price) || price < 0 || price > 500) {
        return NextResponse.json({ ok: false, error: 'Price must be between 0 and 500.' }, { status: 400 })
      }
      data.basePrice = price
      data.pricePending = false
    }
  }

  // Variant price updates
  if (Array.isArray(body.variants)) {
    for (const v of body.variants) {
      const vid = String(v.id ?? '')
      const target = item.variants.find((x) => x.id === vid)
      if (!target) continue
      const price = parseFloat(String(v.price))
      if (!Number.isFinite(price) || price < 0 || price > 500) {
        return NextResponse.json({ ok: false, error: `Variant "${target.name}" price must be between 0 and 500.` }, { status: 400 })
      }
      await db.itemVariant.update({ where: { id: vid }, data: { price } })
    }
  }

  const updated = await db.menuItem.update({ where: { id }, data })

  const changes: string[] = []
  if (data.name !== undefined) changes.push('name')
  if (data.description !== undefined) changes.push('description')
  if (data.basePrice !== undefined) changes.push(`price → ${data.basePrice ?? 'PENDING'}`)
  if (data.available !== undefined) changes.push(`available → ${data.available}`)
  if (body.variants) changes.push('variant prices')
  await audit(session.email, 'MENU_ITEM_UPDATED', 'MENU_ITEM', id, `${updated.name}: ${changes.join(', ') || 'no changes'}`)

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLiveSession } from '@/lib/auth'
import { priceCart, type CartLineInput } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

interface SnapshotSelection {
  groupName?: string
  name?: string
}

/**
 * Reorder — rebuilds a past order against the CURRENT menu.
 *
 * Security: the requester must be the signed-in customer who placed the order,
 * OR present the order's access token (guest tracking link).
 *
 * Integrity: old snapshot prices are NEVER reused. Every line is resolved
 * against today's menu (item → size variant → modifier names) and re-priced by
 * the server pricing engine. Items/options that no longer exist are reported
 * honestly instead of being silently guessed.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const orderNumber = String(body?.orderNumber ?? '').trim().toUpperCase()
    const accessToken = typeof body?.accessToken === 'string' ? body.accessToken : undefined

    if (!orderNumber) {
      return NextResponse.json({ ok: false, error: 'Order number is required.' }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    })
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found. Check your order number.' }, { status: 404 })
    }

    const session = await getLiveSession()
    const isCustomer = !!(order.userId && session && order.userId === session.userId)
    const tokenOk = !!accessToken && accessToken === order.accessToken
    if (!isCustomer && !tokenOk) {
      return NextResponse.json(
        { ok: false, error: 'Sign in with the account that placed this order, or open its tracking link to reorder.' },
        { status: 403 }
      )
    }

    if (order.items.length === 0) {
      return NextResponse.json({ ok: false, error: 'This order has no items to reorder.' }, { status: 400 })
    }

    // Load current menu items — by saved IDs first, with exact-name fallback
    const ids = [...new Set(order.items.map((i) => i.menuItemId).filter((x): x is string => !!x))]
    const names = [...new Set(order.items.map((i) => i.name))]
    const currentItems = await db.menuItem.findMany({
      where: { OR: [{ id: { in: ids } }, { name: { in: names } }] },
      include: { variants: true, modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } } },
    })

    const byId = new Map(currentItems.map((i) => [i.id, i]))
    const byName = new Map<string, typeof currentItems>()
    for (const it of currentItems) {
      const key = it.name.trim().toLowerCase()
      const arr = byName.get(key) ?? []
      arr.push(it)
      byName.set(key, arr)
    }

    function resolveItem(oi: { menuItemId: string | null; name: string }): (typeof currentItems)[number] | null {
      if (oi.menuItemId) {
        const hit = byId.get(oi.menuItemId)
        if (hit) return hit
      }
      const candidates = byName.get(oi.name.trim().toLowerCase())
      // Only fall back to a name match when it is unambiguous
      return candidates && candidates.length === 1 ? candidates[0] : null
    }

    const unavailable: { name: string; reason: string }[] = []
    const droppedOptions: { itemName: string; option: string }[] = []
    const sizeChanged: string[] = []
    const resolved: (CartLineInput & { _imageUrl: string | null; _basePrice: number })[] = []

    for (const oi of order.items) {
      if (resolved.length >= 60) {
        unavailable.push({ name: oi.name, reason: 'Order is too large to reorder in one go.' })
        continue
      }
      const item = resolveItem(oi)
      if (!item) {
        unavailable.push({ name: oi.name, reason: 'No longer on the menu.' })
        continue
      }
      if (!item.available) {
        unavailable.push({ name: item.name, reason: 'Currently unavailable.' })
        continue
      }
      if (item.pricePending || (item.variants.length === 0 && item.basePrice == null)) {
        unavailable.push({ name: item.name, reason: 'Price pending restaurant confirmation — cannot order yet.' })
        continue
      }

      // Size variant: match by saved name, else fall back to the default size
      let variantId: string | undefined
      let basePrice: number
      if (item.variants.length > 0) {
        const matched = oi.variantName
          ? item.variants.find((v) => v.name.trim().toLowerCase() === oi.variantName!.trim().toLowerCase())
          : undefined
        if (matched) {
          variantId = matched.id
          basePrice = matched.price
        } else {
          const dv = item.variants.find((v) => v.isDefault) ?? item.variants[0]
          variantId = dv.id
          basePrice = dv.price
          sizeChanged.push(item.name)
        }
      } else {
        basePrice = item.basePrice as number
      }

      // Options: match saved snapshot names to today's groups/modifiers
      let snap: SnapshotSelection[] = []
      try {
        const parsed = JSON.parse(oi.selections ?? '[]')
        if (Array.isArray(parsed)) snap = parsed
      } catch {
        snap = []
      }
      const groups = item.modifierGroups.map((g) => g.modifierGroup)
      const byGroup = new Map<string, string[]>()
      for (const sel of snap) {
        const optName = String(sel?.name ?? '').trim()
        if (!optName) continue
        const group = groups.find((g) => g.name.trim().toLowerCase() === String(sel?.groupName ?? '').trim().toLowerCase())
        const mod = group?.modifiers.find((m) => m.name.trim().toLowerCase() === optName.toLowerCase())
        if (!group || !mod) {
          droppedOptions.push({ itemName: item.name, option: optName })
          continue
        }
        const arr = byGroup.get(group.id) ?? []
        if (!arr.includes(mod.id)) arr.push(mod.id)
        byGroup.set(group.id, arr)
      }

      // Required groups must still be satisfied, otherwise checkout would reject the line
      const unmet = groups.filter(
        (g) => g.required && (byGroup.get(g.id) ?? []).length < Math.max(1, g.minSelect)
      )
      if (unmet.length > 0) {
        unavailable.push({ name: item.name, reason: `Please re-customize it — its required option (${unmet[0].name}) changed on the menu.` })
        continue
      }

      const qty = Math.min(30, Math.max(1, Math.floor(oi.quantity) || 1))
      resolved.push({
        menuItemId: item.id,
        variantId,
        quantity: qty,
        notes: oi.notes?.slice(0, 300) || undefined,
        selections: [...byGroup.entries()].map(([groupId, modifierIds]) => ({ groupId, modifierIds })),
        _imageUrl: item.imageUrl,
        _basePrice: basePrice,
      })
    }

    if (resolved.length === 0) {
      return NextResponse.json({
        ok: true,
        lines: [],
        unavailable,
        droppedOptions,
        sizeChanged,
        message: "None of the items from this order are available on today's menu.",
      })
    }

    // Re-price with the authoritative engine (PICKUP so delivery settings never block a reorder)
    const { cart, error } = await priceCart(
      resolved.map((r) => ({
        menuItemId: r.menuItemId,
        variantId: r.variantId,
        quantity: r.quantity,
        notes: r.notes,
        selections: r.selections,
      })),
      'PICKUP'
    )
    if (!cart) {
      return NextResponse.json(
        { ok: false, error: error ?? 'Could not re-price this order. Please order from the menu instead.' },
        { status: 400 }
      )
    }

    // Map priced lines (same order as resolved inputs) to client cart display lines
    const lines = cart.lines.map((pl, i) => ({
      menuItemId: pl.menuItemId,
      name: pl.name,
      imageUrl: resolved[i]._imageUrl,
      variantId: resolved[i].variantId,
      variantName: pl.variantName ?? undefined,
      basePrice: resolved[i]._basePrice,
      selections: pl.selections.map((s) => ({
        groupId: s.groupId,
        groupName: s.groupName,
        modifierId: s.modifierId,
        name: s.name,
        price: s.price,
      })),
      notes: pl.notes ?? undefined,
      quantity: pl.quantity,
    }))

    return NextResponse.json({ ok: true, lines, unavailable, droppedOptions, sizeChanged })
  } catch (e) {
    console.error('reorder error', e)
    return NextResponse.json({ ok: false, error: 'Could not build your reorder. Please try again.' }, { status: 500 })
  }
}

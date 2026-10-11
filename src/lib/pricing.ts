// Server-side pricing engine — the ONLY source of truth for prices.
// Client-supplied prices are never trusted; everything is recomputed from the DB.
import 'server-only'
import { db } from '@/lib/db'

export interface CartSelection {
  groupId: string
  modifierIds: string[]
}

export interface CartLineInput {
  menuItemId: string
  variantId?: string
  quantity: number
  selections?: CartSelection[]
  notes?: string
}

export interface PricedSelection {
  groupId: string
  groupName: string
  modifierId: string
  name: string
  price: number
}

export interface PricedLine {
  menuItemId: string
  name: string
  variantName: string | null
  unitPrice: number
  quantity: number
  selections: PricedSelection[]
  notes: string | null
  lineTotal: number
}

export interface PricedCart {
  lines: PricedLine[]
  subtotal: number
  taxRate: number
  taxAmount: number
  deliveryFee: number
  total: number
  hasPricePending: boolean
  hasAlcohol: boolean
}

type Tier = 'SMALL' | 'MEDIUM' | 'LARGE' | 'SICILIAN'

function tierFromVariantName(name: string | null | undefined): Tier {
  if (!name) return 'SMALL'
  const n = name.toUpperCase()
  if (n.startsWith('SICILIAN')) return 'SICILIAN'
  if (n.startsWith('MEDIUM')) return 'MEDIUM'
  if (n.startsWith('LARGE')) return 'LARGE'
  return 'SMALL'
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function priceCart(lines: CartLineInput[], fulfillment: 'PICKUP' | 'DELIVERY'): Promise<{ cart: PricedCart | null; error: string | null }> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { cart: null, error: 'Your cart is empty.' }
  }
  if (lines.length > 60) {
    return { cart: null, error: 'Too many items in a single order.' }
  }

  const itemIds = [...new Set(lines.map((l) => l.menuItemId))]
  const items = await db.menuItem.findMany({
    where: { id: { in: itemIds } },
    include: {
      variants: true,
      modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
    },
  })
  const itemMap = new Map(items.map((i) => [i.id, i]))

  const priced: PricedLine[] = []
  let hasPricePending = false
  let hasAlcohol = false

  for (const line of lines) {
    const item = itemMap.get(line.menuItemId)
    if (!item) return { cart: null, error: 'An item in your cart is no longer on the menu.' }
    if (!item.available) return { cart: null, error: `"${item.name}" is currently unavailable.` }

    const qty = Math.floor(Number(line.quantity))
    if (!Number.isFinite(qty) || qty < 1 || qty > 30) {
      return { cart: null, error: `Invalid quantity for "${item.name}".` }
    }

    // Base price: variant (must belong to this item) or basePrice
    let unitBase = 0
    let variantName: string | null = null
    if (item.variants.length > 0) {
      const variant = line.variantId ? item.variants.find((v) => v.id === line.variantId) : item.variants.find((v) => v.isDefault) ?? item.variants[0]
      if (!variant) return { cart: null, error: `Invalid size selected for "${item.name}".` }
      unitBase = variant.price
      variantName = variant.name
    } else {
      if (item.basePrice == null) {
        return { cart: null, error: `"${item.name}" is awaiting a price from the restaurant and cannot be ordered yet.` }
      }
      unitBase = item.basePrice
    }

    // Modifiers — validated against the item's assigned groups
    const groupLinks = item.modifierGroups
    const selectionMap = new Map((line.selections ?? []).map((s) => [s.groupId, s.modifierIds]))
    const tier = tierFromVariantName(variantName)
    const pricedSelections: PricedSelection[] = []

    for (const link of groupLinks) {
      const group = link.modifierGroup
      const chosenIds = selectionMap.get(group.id) ?? []
      if (group.required && chosenIds.length === 0) {
        return { cart: null, error: `"${item.name}" requires: ${group.name}.` }
      }
      if (chosenIds.length > group.maxSelect) {
        return { cart: null, error: `Too many selections for ${group.name} on "${item.name}" (max ${group.maxSelect}).` }
      }
      for (const modId of chosenIds) {
        const mod = group.modifiers.find((m) => m.id === modId)
        if (!mod) return { cart: null, error: `Invalid option on "${item.name}".` }
        let price = mod.priceDelta
        if (mod.tierPrices) {
          try {
            const tiers = JSON.parse(mod.tierPrices) as Record<string, number>
            price = tiers[tier] ?? mod.priceDelta
          } catch {
            price = mod.priceDelta
          }
        }
        pricedSelections.push({
          groupId: group.id,
          groupName: group.name,
          modifierId: mod.id,
          name: mod.name,
          price: round2(price),
        })
      }
    }

    // Included-count waiver: waive the N cheapest selections (e.g. first calzone topping included)
    if (groupLinks.some((l) => l.modifierGroup.includedCount > 0) && pricedSelections.length > 0) {
      const includedTotal = groupLinks.reduce((acc, l) => acc + l.modifierGroup.includedCount, 0)
      const sortedIdx = pricedSelections
        .map((s, i) => ({ i, price: s.price }))
        .sort((a, b) => a.price - b.price)
        .slice(0, includedTotal)
        .filter((s) => s.price > 0)
        .map((s) => s.i)
      for (const i of sortedIdx) pricedSelections[i].price = 0
    }

    const unitPrice = round2(unitBase + pricedSelections.reduce((a, s) => a + s.price, 0))
    priced.push({
      menuItemId: item.id,
      name: item.name,
      variantName,
      unitPrice,
      quantity: qty,
      selections: pricedSelections,
      notes: typeof line.notes === 'string' ? line.notes.slice(0, 300) : null,
      lineTotal: round2(unitPrice * qty),
    })

    if (item.pricePending) hasPricePending = true
    if (item.isAlcohol) hasAlcohol = true
  }

  const subtotal = round2(priced.reduce((a, l) => a + l.lineTotal, 0))

  const settings = await db.setting.findMany()
  const s = new Map(settings.map((x) => [x.key, x.value]))
  const taxRate = Math.max(0, Math.min(30, parseFloat(s.get('taxRatePercent') ?? '0'))) / 100
  const deliveryEnabled = s.get('deliveryEnabled') === 'true'
  const deliveryFeeSetting = parseFloat(s.get('deliveryFee') ?? '0') || 0

  let deliveryFee = 0
  if (fulfillment === 'DELIVERY') {
    if (!deliveryEnabled) return { cart: null, error: 'Delivery is not available yet. The restaurant has not enabled delivery ordering.' }
    deliveryFee = deliveryFeeSetting
  }

  const taxAmount = round2(subtotal * taxRate)
  const total = round2(subtotal + taxAmount + deliveryFee)

  return {
    cart: { lines: priced, subtotal, taxRate, taxAmount, deliveryFee, total, hasPricePending, hasAlcohol },
    error: null,
  }
}

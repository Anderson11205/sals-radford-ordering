'use client'

// Item customization modal — live price updates as options change
import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { fmt, type ApiMenuItem, type ApiVariant, type ApiModifierGroup } from '@/lib/menu-types'
import { useCart, type CartSelection } from '@/lib/cart-store'
import Image from 'next/image'

interface Props {
  item: ApiMenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SIZE_TIER_KEYS = ['SMALL', 'MEDIUM', 'LARGE', 'SICILIAN']

function tierFromVariant(name: string): string {
  const n = name.toUpperCase()
  if (n.startsWith('SICILIAN')) return 'SICILIAN'
  if (n.startsWith('MEDIUM')) return 'MEDIUM'
  if (n.startsWith('LARGE')) return 'LARGE'
  return 'SMALL'
}

export function ItemModal({ item, open, onOpenChange }: Props) {
  const addLine = useCart((s) => s.addLine)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [notes, setNotes] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [modalKey, setModalKey] = useState(0)

  // Reset state whenever a new item opens
  const itemKey = item?.id ?? 'none'
  const [lastKey, setLastKey] = useState(itemKey)
  if (lastKey !== itemKey) {
    setLastKey(itemKey)
    setVariantId(null)
    setSelected({})
    setNotes('')
    setQuantity(1)
    setModalKey((k) => k + 1)
  }

  const defaultVariant: ApiVariant | undefined = useMemo(() => {
    if (!item) return undefined
    return item.variants.find((v) => v.isDefault) ?? item.variants[0]
  }, [item])

  const activeVariant: ApiVariant | undefined =
    item && item.variants.length > 0 ? item.variants.find((v) => v.id === (variantId ?? defaultVariant?.id)) : undefined

  const basePrice = activeVariant ? activeVariant.price : item?.basePrice ?? 0
  const tier = activeVariant ? tierFromVariant(activeVariant.name) : 'SMALL'

  const groups: ApiModifierGroup[] = item ? item.modifierGroups.map((g) => g.modifierGroup) : []

  function modifierPrice(group: ApiModifierGroup, mod: { priceDelta: number; tierPrices: string | null }): number {
    if (mod.tierPrices) {
      try {
        const tiers = JSON.parse(mod.tierPrices) as Record<string, number>
        return tiers[tier] ?? mod.priceDelta
      } catch {
        return mod.priceDelta
      }
    }
    return mod.priceDelta
  }

  // Direct computation (cheap; avoids manual memoization pitfalls)
  const selections: CartSelection[] = (() => {
    if (!item) return []
    const out: CartSelection[] = []
    for (const g of groups) {
      for (const mid of selected[g.id] ?? []) {
        const mod = g.modifiers.find((m) => m.id === mid)
        if (!mod) continue
        const price = modifierPrice(g, mod)
        out.push({ groupId: g.id, groupName: g.name, modifierId: mod.id, name: mod.name, price })
      }
    }
    // Apply includedCount waiver (first N cheapest included)
    const includedTotal = groups.reduce((a, g) => a + g.includedCount, 0)
    if (includedTotal > 0 && out.length > 0) {
      out
        .map((s, i) => ({ i, price: s.price }))
        .sort((a, b) => a.price - b.price)
        .slice(0, includedTotal)
        .filter((s) => s.price > 0)
        .forEach((s) => (out[s.i].price = 0))
    }
    return out
  })()

  const modifiersTotal = selections.reduce((a, s) => a + s.price, 0)
  const unitPrice = Math.round((basePrice + modifiersTotal) * 100) / 100
  const totalPrice = Math.round(unitPrice * quantity * 100) / 100

  const missingRequired = groups.filter((g) => g.required && (selected[g.id] ?? []).length < g.minSelect)

  function toggle(group: ApiModifierGroup, modId: string) {
    setSelected((prev) => {
      const cur = prev[group.id] ?? []
      if (cur.includes(modId)) {
        return { ...prev, [group.id]: cur.filter((x) => x !== modId) }
      }
      if (group.maxSelect === 1) {
        return { ...prev, [group.id]: [modId] }
      }
      if (cur.length >= group.maxSelect) {
        return prev
      }
      return { ...prev, [group.id]: [...cur, modId] }
    })
  }

  function handleAdd() {
    if (!item) return
    if (missingRequired.length > 0) return
    addLine({
      menuItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      variantId: activeVariant?.id,
      variantName: activeVariant?.name,
      basePrice,
      selections,
      notes: notes.trim() || undefined,
      quantity,
    })
    onOpenChange(false)
    setVariantId(null)
    setSelected({})
    setNotes('')
    setQuantity(1)
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" key={modalKey}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{item.name}</DialogTitle>
          {item.description && <DialogDescription className="text-sm">{item.description}</DialogDescription>}
        </DialogHeader>

        {item.imageUrl && (
          <div className="relative h-40 w-full overflow-hidden rounded-lg bg-secondary">
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 500px" unoptimized />
          </div>
        )}

        {/* Variants */}
        {item.variants.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Choose size</h4>
            <RadioGroup value={variantId ?? defaultVariant?.id} onValueChange={(v) => setVariantId(v)} className="gap-2">
              {item.variants.map((v) => (
                <Label
                  key={v.id}
                  htmlFor={`v-${v.id}`}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5 has-[[data-state=checked]]:border-[#C20E0E] has-[[data-state=checked]]:bg-red-50/50"
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium">
                    <RadioGroupItem id={`v-${v.id}`} value={v.id} />
                    {v.name}
                  </span>
                  <span className="text-sm font-semibold">{fmt(v.price)}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Modifier groups */}
        {groups.map((g) => (
          <div key={g.id}>
            <h4 className="mb-1 text-sm font-semibold">
              {g.name}
              {g.required && <span className="ml-1.5 text-xs font-medium text-[#C20E0E]">Required</span>}
              {g.maxSelect > 1 && !g.required && <span className="ml-1.5 text-xs font-medium text-muted-foreground">Optional · up to {g.maxSelect}</span>}
            </h4>
            {g.includedCount > 0 && <p className="mb-2 text-xs text-muted-foreground">{g.includedCount === 1 ? 'Your first selection is included free.' : `${g.includedCount} selections included free.`}</p>}
            <div className={g.maxSelect === 1 ? 'space-y-2' : 'grid gap-2 sm:grid-cols-2'}>
              {g.maxSelect === 1 ? (
                <RadioGroup
                  value={(selected[g.id] ?? [])[0] ?? ''}
                  onValueChange={(v) => setSelected((prev) => ({ ...prev, [g.id]: v ? [v] : [] }))}
                  className="gap-2"
                >
                  {g.modifiers.map((m) => {
                    const price = modifierPrice(g, m)
                    return (
                      <Label
                        key={m.id}
                        htmlFor={`m-${m.id}`}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5 has-[[data-state=checked]]:border-[#C20E0E] has-[[data-state=checked]]:bg-red-50/50"
                      >
                        <span className="flex items-center gap-2.5 text-sm font-medium">
                          <RadioGroupItem id={`m-${m.id}`} value={m.id} />
                          {m.name}
                        </span>
                        {price > 0 && <span className="text-sm font-semibold text-[#3D8B37]">+{fmt(price)}</span>}
                      </Label>
                    )
                  })}
                </RadioGroup>
              ) : (
                g.modifiers.map((m) => {
                  const price = modifierPrice(g, m)
                  const checked = (selected[g.id] ?? []).includes(m.id)
                  return (
                    <Label
                      key={m.id}
                      htmlFor={`m-${m.id}`}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5 has-[[data-state=checked]]:border-[#C20E0E] has-[[data-state=checked]]:bg-red-50/50"
                    >
                      <span className="flex items-center gap-2.5 text-sm font-medium">
                        <Checkbox id={`m-${m.id}`} checked={checked} onCheckedChange={() => toggle(g, m.id)} />
                        {m.name}
                      </span>
                      {price > 0 && <span className="text-sm font-semibold text-[#3D8B37]">+{fmt(price)}</span>}
                    </Label>
                  )
                })
              )}
            </div>
          </div>
        ))}

        {/* Notes */}
        <div>
          <h4 className="mb-2 text-sm font-semibold">Special instructions (optional)</h4>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            placeholder="e.g. extra crispy, light sauce, cut in half…"
            className="min-h-[64px]"
          />
          <p className="mt-1 text-xs text-muted-foreground">Food allergies? Add a note at checkout — see our allergy notice on the checkout page.</p>
        </div>

        {/* Quantity + add */}
        <div className="sticky bottom-0 -mx-1 flex items-center gap-3 border-t border-border bg-white px-1 pb-1 pt-3">
          <div className="flex items-center rounded-full border border-border">
            <button type="button" className="h-10 w-10 text-lg font-semibold disabled:opacity-30" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">
              −
            </button>
            <Input
              type="number"
              min={1}
              max={30}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
              className="h-10 w-12 border-0 p-0 text-center focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Quantity"
            />
            <button type="button" className="h-10 w-10 text-lg font-semibold disabled:opacity-30" onClick={() => setQuantity((q) => Math.min(30, q + 1))} disabled={quantity >= 30} aria-label="Increase quantity">
              +
            </button>
          </div>
          <Button className="btn-brand h-11 flex-1 text-sm" onClick={handleAdd} disabled={missingRequired.length > 0 || item.pricePending}>
            {item.pricePending ? 'Price pending — unavailable' : `Add to cart · ${fmt(totalPrice)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

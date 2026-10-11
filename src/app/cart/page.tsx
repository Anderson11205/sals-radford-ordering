'use client'

// Shopping cart — quantities, notes, removal, subtotal (server re-validates at checkout)
import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCart, lineTotalOf, cartSubtotal, cartCount, unitPriceOf } from '@/lib/cart-store'
import { fmt } from '@/lib/menu-types'

const subscribeNoop = () => () => {}

export default function CartPage() {
  const { lines, updateLine, removeLine } = useCart()
  // Hydration-safe mount detection (persisted store only exists on the client)
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false)

  if (!mounted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Loading your cart…</div>
    )
  }

  const count = cartCount(lines)
  const subtotal = cartSubtotal(lines)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">
        Your <span className="text-[#C20E0E]">Cart</span>
      </h1>

      {lines.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden />
          <p className="mt-3 text-lg font-semibold">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Browse the menu and add something delicious.</p>
          <Link href="/menu" className="btn-brand mt-5 inline-flex h-11 items-center px-6">
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {lines.map((line) => (
              <li key={line.lineId} className="rounded-xl border border-border bg-white p-4">
                <div className="flex gap-3">
                  {line.imageUrl && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      <Image src={line.imageUrl} alt="" fill className="object-cover" sizes="64px" unoptimized />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-snug">{line.name}</h3>
                        {line.variantName && <p className="text-xs text-muted-foreground">{line.variantName}</p>}
                      </div>
                      <button
                        onClick={() => removeLine(line.lineId)}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-red-50 hover:text-[#C20E0E]"
                        aria-label={`Remove ${line.name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {line.selections.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {line.selections.map((s) => (
                          <li key={s.modifierId} className="text-xs text-muted-foreground">
                            + {s.name} {s.price > 0 ? <span className="text-[#3D8B37]">({fmt(s.price)})</span> : <span className="text-[#3D8B37]">(included)</span>}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center rounded-full border border-border">
                        <button
                          className="flex h-8 w-8 items-center justify-center"
                          onClick={() => updateLine(line.lineId, { quantity: Math.max(1, line.quantity - 1) })}
                          aria-label="Decrease quantity"
                          disabled={line.quantity <= 1}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                          {line.quantity}
                        </span>
                        <button
                          className="flex h-8 w-8 items-center justify-center"
                          onClick={() => updateLine(line.lineId, { quantity: Math.min(30, line.quantity + 1) })}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{fmt(unitPriceOf(line))} each</p>
                        <p className="font-bold">{fmt(lineTotalOf(line))}</p>
                      </div>
                    </div>

                    <Textarea
                      value={line.notes ?? ''}
                      onChange={(e) => updateLine(line.lineId, { notes: e.target.value.slice(0, 300) })}
                      placeholder="Add preparation notes for the kitchen…"
                      className="mt-2 min-h-[48px] text-xs"
                      aria-label={`Preparation notes for ${line.name}`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Items</span>
              <span>{count}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="font-semibold">Subtotal</span>
              <span className="text-lg font-bold">{fmt(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Taxes and delivery fees (if any) are calculated at checkout. All prices are verified server-side when you
              place the order.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href="/menu" className="flex-1">
                <Button variant="outline" className="h-11 w-full">
                  Continue shopping
                </Button>
              </Link>
              <Link href="/checkout" className="flex-[2]">
                <Button className="btn-brand h-11 w-full text-base">
                  Go to checkout <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

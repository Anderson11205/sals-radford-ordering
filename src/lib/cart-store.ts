'use client'

// Client cart store — display only. The server always recalculates prices at checkout.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartSelection {
  groupId: string
  groupName: string
  modifierId: string
  name: string
  price: number
}

export interface CartLine {
  lineId: string // unique per cart line
  menuItemId: string
  name: string
  imageUrl?: string | null
  variantId?: string
  variantName?: string
  basePrice: number // unit base (variant or base price)
  selections: CartSelection[]
  notes?: string
  quantity: number
}

export interface CartLineInput {
  menuItemId: string
  variantId?: string
  quantity: number
  selections: { groupId: string; modifierIds: string[] }[]
  notes?: string
}

interface CartState {
  lines: CartLine[]
  addLine: (line: Omit<CartLine, 'lineId'>) => void
  updateLine: (lineId: string, patch: Partial<Pick<CartLine, 'quantity' | 'notes'>>) => void
  removeLine: (lineId: string) => void
  clear: () => void
}

function unitPriceOf(line: CartLine): number {
  return Math.round((line.basePrice + line.selections.reduce((a, s) => a + s.price, 0)) * 100) / 100
}

export function lineTotalOf(line: CartLine): number {
  return Math.round(unitPriceOf(line) * line.quantity * 100) / 100
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((a, l) => a + l.quantity, 0)
}

export function cartSubtotal(lines: CartLine[]): number {
  return Math.round(lines.reduce((a, l) => a + lineTotalOf(l), 0) * 100) / 100
}

export function toCartInput(lines: CartLine[]): CartLineInput[] {
  return lines.map((l) => ({
    menuItemId: l.menuItemId,
    variantId: l.variantId,
    quantity: l.quantity,
    notes: l.notes,
    selections: Object.values(
      l.selections.reduce<Record<string, { groupId: string; modifierIds: string[] }>>((acc, s) => {
        ;(acc[s.groupId] ??= { groupId: s.groupId, modifierIds: [] }).modifierIds.push(s.modifierId)
        return acc
      }, {})
    ),
  }))
}

let lineCounter = 0
function nextLineId(): string {
  lineCounter += 1
  return `line-${Date.now()}-${lineCounter}`
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addLine: (line) =>
        set((state) => {
          // Merge identical lines (same item, variant, selections, no notes)
          const sig = (l: Omit<CartLine, 'lineId' | 'quantity'>) =>
            `${l.menuItemId}|${l.variantId ?? ''}|${l.selections.map((s) => s.modifierId).sort().join(',')}|${l.notes ?? ''}`
          const incoming = sig(line)
          const existing = state.lines.find((l) => sig(l) === incoming)
          if (existing) {
            return {
              lines: state.lines.map((l) => (l.lineId === existing.lineId ? { ...l, quantity: Math.min(30, l.quantity + line.quantity) } : l)),
            }
          }
          return { lines: [...state.lines, { ...line, lineId: nextLineId() }] }
        }),
      updateLine: (lineId, patch) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)),
        })),
      removeLine: (lineId) => set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'sals-cart' }
  )
)

export { unitPriceOf }

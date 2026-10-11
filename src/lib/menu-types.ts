// Shared client-side types mirroring the /api/menu payload
export interface ApiModifier {
  id: string
  name: string
  priceDelta: number
  tierPrices: string | null
  sortOrder: number
}

export interface ApiModifierGroup {
  id: string
  key: string
  name: string
  minSelect: number
  maxSelect: number
  required: boolean
  includedCount: number
  modifiers: ApiModifier[]
}

export interface ApiVariant {
  id: string
  name: string
  price: number
  isDefault: boolean
  sortOrder: number
}

export interface ApiMenuItem {
  id: string
  categoryId: string
  name: string
  description: string | null
  basePrice: number | null
  pricePending: boolean
  imageUrl: string | null
  available: boolean
  popular: boolean
  isAlcohol: boolean
  needsSizeTier: boolean
  variants: ApiVariant[]
  modifierGroups: { sortOrder: number; modifierGroup: ApiModifierGroup }[]
}

export interface ApiCategory {
  id: string
  slug: string
  name: string
  italianName: string | null
  description: string | null
  image: string | null
  items: ApiMenuItem[]
}

export function fmt(n: number): string {
  return `$${n.toFixed(2)}`
}

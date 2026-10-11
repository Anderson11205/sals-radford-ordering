import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { audit } from '@/lib/store-utils'

export const dynamic = 'force-dynamic'

/** Admin menu listing (includes unavailable + price-pending items). */
export async function GET(req: NextRequest) {
  const session = await requireRole(['OWNER', 'MANAGER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 })

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  const items = await db.menuItem.findMany({
    where: q ? { name: { contains: q } } : {},
    orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    include: { category: { select: { name: true, slug: true } }, variants: { orderBy: { sortOrder: 'asc' } } },
  })

  return NextResponse.json({
    ok: true,
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      category: i.category.name,
      categoryId: i.categoryId,
      basePrice: i.basePrice,
      pricePending: i.pricePending,
      available: i.available,
      popular: i.popular,
      isAlcohol: i.isAlcohol,
      variants: i.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
    })),
  })
}

/** Create a new menu item (manager can add; owner approves via review). */
export async function POST(req: NextRequest) {
  const session = await requireRole(['OWNER', 'MANAGER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 })

  const body = await req.json()
  const name = String(body.name ?? '').trim().slice(0, 120)
  const description = String(body.description ?? '').trim().slice(0, 600) || null
  const categoryId = String(body.categoryId ?? '')
  const price = body.price != null ? parseFloat(String(body.price)) : null
  const isAlcohol = body.isAlcohol === true

  if (name.length < 2) return NextResponse.json({ ok: false, error: 'Item name is required.' }, { status: 400 })
  if (!categoryId) return NextResponse.json({ ok: false, error: 'Category is required.' }, { status: 400 })
  if (price != null && (!Number.isFinite(price) || price < 0 || price > 500)) {
    return NextResponse.json({ ok: false, error: 'Price must be between 0 and 500.' }, { status: 400 })
  }

  const category = await db.category.findUnique({ where: { id: categoryId } })
  if (!category) return NextResponse.json({ ok: false, error: 'Category not found.' }, { status: 404 })

  const maxSort = await db.menuItem.aggregate({ where: { categoryId }, _max: { sortOrder: true } })
  const item = await db.menuItem.create({
    data: {
      name,
      description,
      categoryId,
      basePrice: price,
      pricePending: price == null,
      isAlcohol,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  })

  await audit(session.email, 'MENU_ITEM_CREATED', 'MENU_ITEM', item.id, name)
  return NextResponse.json({ ok: true, id: item.id })
}

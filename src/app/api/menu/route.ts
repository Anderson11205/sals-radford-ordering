import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            variants: { orderBy: { sortOrder: 'asc' } },
            modifierGroups: {
              orderBy: { sortOrder: 'asc' },
              include: { modifierGroup: { include: { modifiers: { orderBy: { sortOrder: 'asc' } } } } },
            },
          },
        },
      },
    })
    return NextResponse.json({ ok: true, categories })
  } catch (e) {
    console.error('menu GET error', e)
    return NextResponse.json({ ok: false, error: 'Could not load the menu. Please try again.' }, { status: 500 })
  }
}

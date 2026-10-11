// Seed script — imports the official Sal's menu into the database
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GROUPS } from './seed-data'
import { CATEGORIES_A } from './seed-items-a'
import { CATEGORIES_B } from './seed-items-b'

const db = new PrismaClient()

// Per-item food photos generated from real photo search (catSlug::ItemName → /images/items/...)
let ITEM_IMAGES: Record<string, string> = {}
try {
  const here = dirname(fileURLToPath(import.meta.url))
  ITEM_IMAGES = JSON.parse(readFileSync(join(here, 'images.generated.json'), 'utf8'))
} catch { /* file optional — items fall back to category images */ }

const DEFAULT_SETTINGS: Record<string, string> = [
  // Fulfillment — pickup on by default; delivery OFF until the restaurant configures coverage & fee
  ['pickupEnabled', 'true'],
  ['deliveryEnabled', 'false'],
  ['deliveryFee', '0'],
  ['deliveryMinimum', '0'],
  // Tax — Radford VA meals tax must be confirmed by the restaurant; 0 until configured
  ['taxRatePercent', '0'],
  ['taxRateConfirmed', 'false'],
  // Payment — proposed bank details are stored but NOT activated until the owner verifies them
  ['bankTransferEnabled', 'false'],
  ['bankName', 'Sterling Bank'],
  ['bankAccountName', "Sal's Italian Restaurant & Pizzeria"],
  ['bankAccountNumber', '1234467789'],
  ['bankDetailsVerified', 'false'],
  // Invitations
  ['inviteExpiryHours', '72'],
  // Meta
  ['menuImportedAt', new Date().toISOString()],
  ['menuSource', 'Official menu PDFs linked from salsradford.com/menu/'],
].reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})

async function main() {
  console.log('Seeding Sal\'s Italian Restaurant & Pizzeria...')

  // Wipe menu + transactional data (users/orders preserved on reseed? For fresh installs wipe all)
  await db.notification.deleteMany()
  await db.paymentSubmission.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.menuItemModifierGroup.deleteMany()
  await db.itemVariant.deleteMany()
  await db.modifier.deleteMany()
  await db.modifierGroup.deleteMany()
  await db.menuItem.deleteMany()
  await db.category.deleteMany()
  await db.setting.deleteMany()

  // Settings
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.setting.create({ data: { key, value } })
  }
  console.log('Settings created')

  // Shared modifier groups
  for (const g of GROUPS) {
    await db.modifierGroup.create({
      data: {
        key: g.key,
        name: g.name,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        required: g.required,
        includedCount: g.includedCount ?? 0,
        modifiers: {
          create: g.modifiers.map((m, i) => ({
            name: m.name,
            priceDelta: m.price ?? 0,
            tierPrices: m.tier ? JSON.stringify(m.tier) : null,
            sortOrder: i,
          })),
        },
      },
    })
  }
  console.log(`${GROUPS.length} modifier groups created`)

  let itemCount = 0
  let variantCount = 0
  let pendingPrices: string[] = []
  const allCategories = [...CATEGORIES_A, ...CATEGORIES_B]

  for (let ci = 0; ci < allCategories.length; ci++) {
    const cat = allCategories[ci]
    const category = await db.category.create({
      data: {
        slug: cat.slug,
        name: cat.name,
        italianName: cat.italianName ?? null,
        description: cat.description ?? null,
        image: cat.image ?? null,
        sortOrder: ci,
      },
    })

    for (let ii = 0; ii < cat.items.length; ii++) {
      const it = cat.items[ii]
      const item = await db.menuItem.create({
        data: {
          categoryId: category.id,
          name: it.name,
          description: it.description ?? null,
          basePrice: it.price ?? null,
          pricePending: it.pricePending ?? false,
          imageUrl: it.image ?? null,
          popular: it.popular ?? false,
          isAlcohol: it.alcohol ?? false,
          needsSizeTier: it.sizeTier ?? false,
          sortOrder: ii,
        },
      })
      itemCount++

      if (it.variants?.length) {
        for (let vi = 0; vi < it.variants.length; vi++) {
          const v = it.variants[vi]
          await db.itemVariant.create({
            data: { menuItemId: item.id, name: v.name, price: v.price, isDefault: v.isDefault ?? false, sortOrder: vi },
          })
          variantCount++
        }
      }

      if (it.pricePending) pendingPrices.push(`${cat.name} — ${it.name}`)

      if (it.groups?.length) {
        for (let gi = 0; gi < it.groups.length; gi++) {
          const g = await db.modifierGroup.findUnique({ where: { key: it.groups[gi] } })
          if (!g) throw new Error(`Unknown modifier group key: ${it.groups[gi]} (item: ${it.name})`)
          await db.menuItemModifierGroup.create({
            data: { menuItemId: item.id, modifierGroupId: g.id, sortOrder: gi },
          })
        }
      }
    }
  }

  // Apply per-item photos (real images fetched for each dish; items without one fall back to category image in the UI)
  let imgApplied = 0
  for (const [key, img] of Object.entries(ITEM_IMAGES)) {
    const sep = key.indexOf('::')
    const catSlug = key.slice(0, sep)
    const name = key.slice(sep + 2)
    const r = await db.menuItem.updateMany({
      where: { name, category: { slug: catSlug } },
      data: { imageUrl: img },
    })
    imgApplied += r.count
  }

  await db.auditLog.create({
    data: {
      actorEmail: 'system@seed',
      action: 'MENU_IMPORT',
      entity: 'MENU',
      details: `Imported ${allCategories.length} categories, ${itemCount} items, ${variantCount} variants from official menu PDFs`,
    },
  })

  console.log(`Done: ${allCategories.length} categories, ${itemCount} items, ${variantCount} variants, ${imgApplied} item photos applied`)
  console.log(`Price-pending items (${pendingPrices.length}):`)
  pendingPrices.forEach((p) => console.log('  -', p))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

// Applies generated per-item images (prisma/images.generated.json) to the database.
// Usage: DATABASE_URL=... bun prisma/apply-images.ts
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const db = new PrismaClient()
const here = dirname(fileURLToPath(import.meta.url))
const MAP: Record<string, string> = JSON.parse(readFileSync(join(here, 'images.generated.json'), 'utf8'))

async function main() {
  let applied = 0
  for (const [key, img] of Object.entries(MAP)) {
    const sep = key.indexOf('::')
    const catSlug = key.slice(0, sep)
    const name = key.slice(sep + 2)
    const r = await db.menuItem.updateMany({
      where: { name, category: { slug: catSlug } },
      data: { imageUrl: img },
    })
    applied += r.count
  }
  console.log(`apply-images: updated ${applied} items (map had ${Object.keys(MAP).length})`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())

// Settings helpers + notification + audit + order number utilities
import 'server-only'
import { db } from '@/lib/db'

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.setting.findMany()
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
}

export async function notifyStaff(title: string, body: string, orderId?: string): Promise<void> {
  await db.notification.create({ data: { audience: 'STAFF', title, body, orderId: orderId ?? null } })
}

export async function notifyCustomer(userId: string | null, title: string, body: string, orderId?: string): Promise<void> {
  // Registered customers get an inbox message; guests still get an order-linked
  // timeline entry so the tracking page shows genuine updates.
  if (!userId && !orderId) return
  await db.notification.create({
    data: { audience: 'CUSTOMER', userId: userId ?? null, orderId: orderId ?? null, title, body },
  })
}

export async function audit(actorEmail: string, action: string, entity: string, entityId?: string, details?: string): Promise<void> {
  await db.auditLog.create({
    data: { actorEmail, action, entity, entityId: entityId ?? null, details: details ?? null },
  })
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no confusing chars (0/O/1/I/L)

export function generateOrderNumber(): string {
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return `SLS-${suffix}`
}

export function generateToken(bytes = 24): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

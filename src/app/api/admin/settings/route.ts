import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, OWNER_EMAIL } from '@/lib/auth'
import { getSettings, setSetting, audit } from '@/lib/store-utils'

export const dynamic = 'force-dynamic'

const OWNER_KEYS = new Set([
  'pickupEnabled',
  'deliveryEnabled',
  'deliveryFee',
  'deliveryMinimum',
  'taxRatePercent',
  'taxRateConfirmed',
  'bankTransferEnabled',
  'bankName',
  'bankAccountName',
  'bankAccountNumber',
  'bankDetailsVerified',
  'inviteExpiryHours',
])

export async function GET() {
  const session = await requireRole(['OWNER', 'MANAGER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Not authorized.' }, { status: 403 })
  const settings = await getSettings()
  // Managers see operational settings but never unverified bank details
  if (session.role === 'MANAGER') {
    const safe: Record<string, string> = {}
    for (const [k, v] of Object.entries(settings)) {
      if (k.startsWith('bank')) safe[k] = 'RESTRICTED (owner only)'
      else safe[k] = v
    }
    return NextResponse.json({ ok: true, settings: safe, readOnly: true, ownerEmail: OWNER_EMAIL })
  }
  return NextResponse.json({ ok: true, settings, readOnly: false, ownerEmail: OWNER_EMAIL })
}

export async function PATCH(req: NextRequest) {
  const session = await requireRole(['OWNER'])
  if (!session) return NextResponse.json({ ok: false, error: 'Only the primary owner can change settings.' }, { status: 403 })

  const body = await req.json()
  const changes = body.settings as Record<string, string> | undefined
  if (!changes || typeof changes !== 'object') {
    return NextResponse.json({ ok: false, error: 'No settings provided.' }, { status: 400 })
  }

  const applied: string[] = []
  // Apply dependent flags in a safe order: verification switches first, then the
  // switches that require them — so the owner can verify + activate in ONE save.
  const order = (k: string) =>
    k === 'bankDetailsVerified' ? 0 : k === 'bankTransferEnabled' ? 1 : k === 'taxRatePercent' ? 2 : k === 'taxRateConfirmed' ? 3 : 4
  const entries = Object.entries(changes).sort((a, b) => order(a[0]) - order(b[0]))
  for (const [key, value] of entries) {
    if (!OWNER_KEYS.has(key)) continue

    // Safety interlocks
    if (key === 'deliveryEnabled' && value === 'true') {
      const fee = parseFloat(await db.setting.findUnique({ where: { key: 'deliveryFee' } }).then((s) => s?.value ?? '0'))
      if (!Number.isFinite(fee) || fee < 0) {
        return NextResponse.json({ ok: false, error: 'Set a valid delivery fee before enabling delivery.' }, { status: 400 })
      }
    }
    if (key === 'bankTransferEnabled' && value === 'true') {
      const verified = await db.setting.findUnique({ where: { key: 'bankDetailsVerified' } })
      if (verified?.value !== 'true') {
        return NextResponse.json(
          { ok: false, error: 'First check “I have verified these details with the bank” above, then activate bank transfer.' },
          { status: 400 }
        )
      }
    }
    if (key === 'taxRateConfirmed' && value === 'true') {
      const tax = parseFloat(await db.setting.findUnique({ where: { key: 'taxRatePercent' } }).then((s) => s?.value ?? '0'))
      if (!Number.isFinite(tax) || tax <= 0) {
        return NextResponse.json({ ok: false, error: 'Enter a valid tax rate before confirming it.' }, { status: 400 })
      }
    }

    await setSetting(key, String(value).slice(0, 200))
    applied.push(key)
  }

  await audit(session.email, 'SETTINGS_UPDATED', 'SETTING', undefined, applied.join(', '))
  const settings = await getSettings()
  return NextResponse.json({ ok: true, settings })
}

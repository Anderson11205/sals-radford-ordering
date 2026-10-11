import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/store-utils'

export const dynamic = 'force-dynamic'

/**
 * Public, non-sensitive settings for the customer UI.
 * Bank account details (name, bank, account number) are published ONLY while the
 * owner has bank transfer enabled from the admin dashboard — customers need them
 * to send the transfer, then confirm "I have paid" for staff review.
 */
export async function GET() {
  const s = await getSettings()
  const bankTransferOn = s.bankTransferEnabled === 'true'
  return NextResponse.json({
    ok: true,
    settings: {
      pickupEnabled: s.pickupEnabled,
      deliveryEnabled: s.deliveryEnabled,
      deliveryFee: s.deliveryFee,
      deliveryMinimum: s.deliveryMinimum,
      taxRatePercent: s.taxRatePercent,
      bankTransferEnabled: s.bankTransferEnabled,
      bankName: bankTransferOn ? s.bankName || undefined : undefined,
      bankAccountName: bankTransferOn ? s.bankAccountName || undefined : undefined,
      bankAccountNumber: bankTransferOn ? s.bankAccountNumber || undefined : undefined,
    },
  })
}

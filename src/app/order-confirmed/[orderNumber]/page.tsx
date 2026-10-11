import { OrderTracker } from '@/components/order-tracker'
import { ConfirmationHero } from '@/components/confirmation-hero'

export const metadata = { title: 'Order confirmed' }

export default async function OrderConfirmedPage({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string }> }) {
  const { orderNumber } = await params
  const { t } = await searchParams
  return (
    <div>
      <ConfirmationHero orderNumber={orderNumber} accessToken={t} />
      <OrderTracker orderNumber={orderNumber} accessToken={t} />
    </div>
  )
}

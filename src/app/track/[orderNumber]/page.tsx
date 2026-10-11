import { OrderTracker } from '@/components/order-tracker'

export const metadata = { title: 'Track your order' }

export default async function TrackOrderPage({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string }> }) {
  const { orderNumber } = await params
  const { t } = await searchParams
  return (
    <div>
      <div className="sals-cream border-b border-border py-5 text-center">
        <h1 className="text-2xl font-extrabold">Track your order</h1>
      </div>
      <OrderTracker orderNumber={orderNumber} accessToken={t} />
    </div>
  )
}

'use client'

// Admin dashboard — real numbers from the database, never fabricated
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Clock, ChefHat, PackageCheck, Bike, CheckCircle2, XCircle, Landmark, AlertTriangle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmt } from '@/lib/menu-types'

interface Stats {
  newOrders: number
  paymentReview: number
  preparing: number
  ready: number
  outForDelivery: number
  completed: number
  cancelled: number
  unreadStaff: number
  openTotal: number
  openCount: number
  completedTotal: number
  completedCount: number
  menuItemCount: number
  unavailableCount: number
  pricePendingCount: number
  recentOrders: { orderNumber: string; customerName: string; status: string; total: number; fulfillment: string; createdAt: string }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = () =>
      fetch('/api/admin/stats', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => (d.ok ? setStats(d.stats) : setError(d.error)))
        .catch(() => setError('Could not load dashboard data.'))
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  if (error) {
    return <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>
  }
  if (!stats) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-[#C20E0E]" aria-label="Loading stats" />
      </div>
    )
  }

  const tiles = [
    { label: 'New orders', value: stats.newOrders, icon: ClipboardList, href: '/admin/orders?status=ORDER_RECEIVED' },
    { label: 'Awaiting payment / review', value: stats.paymentReview, icon: Landmark, href: '/admin/payments' },
    { label: 'Preparing', value: stats.preparing, icon: ChefHat, href: '/admin/orders?status=PREPARING' },
    { label: 'Ready for pickup', value: stats.ready, icon: PackageCheck, href: '/admin/orders?status=READY_FOR_PICKUP' },
    { label: 'Out for delivery', value: stats.outForDelivery, icon: Bike, href: '/admin/orders?status=OUT_FOR_DELIVERY' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, href: '/admin/orders?status=COMPLETED' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, href: '/admin/orders?status=CANCELLED' },
    { label: 'Staff notifications', value: stats.unreadStaff, icon: AlertTriangle, href: '/admin/orders' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon
          return (
            <Link key={t.label} href={t.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C20E0E]/10">
                    <Icon className="h-5 w-5 text-[#C20E0E]" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xl font-extrabold leading-none">{t.value}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{t.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Sales totals — real data only */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">All non-cancelled orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold">{fmt(stats.openTotal)}</p>
            <p className="text-xs text-muted-foreground">across {stats.openCount} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Completed sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-[#3D8B37]">{fmt(stats.completedTotal)}</p>
            <p className="text-xs text-muted-foreground">across {stats.completedCount} completed orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Menu health */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-extrabold">{stats.menuItemCount}</p>
            <p className="text-xs text-muted-foreground">Menu items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className={`text-2xl font-extrabold ${stats.unavailableCount > 0 ? 'text-amber-600' : ''}`}>{stats.unavailableCount}</p>
            <p className="text-xs text-muted-foreground">Currently unavailable</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className={`text-2xl font-extrabold ${stats.pricePendingCount > 0 ? 'text-amber-600' : ''}`}>{stats.pricePendingCount}</p>
            <p className="text-xs text-muted-foreground">Prices pending confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet — they will appear here in real time.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recentOrders.map((o) => (
                <li key={o.orderNumber} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="font-mono font-semibold">{o.orderNumber}</span>
                  <span className="text-muted-foreground">{o.customerName}</span>
                  <span className="text-xs text-muted-foreground">{o.fulfillment === 'DELIVERY' ? 'Delivery' : 'Pickup'}</span>
                  <span className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleTimeString()}</span>
                  <span className="font-bold">{fmt(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

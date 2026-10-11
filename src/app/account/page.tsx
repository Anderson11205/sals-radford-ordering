'use client'

// Account dashboard — orders + notification inbox
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, PackageSearch, MailOpen, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReorderButton } from '@/components/reorder-button'
import { useToast } from '@/hooks/use-toast'
import { fmt } from '@/lib/menu-types'

interface Me {
  user: { userId: string; name: string; email: string; role: string } | null
  unreadNotifications?: number
}

interface OrderRow {
  orderNumber: string
  accessToken: string
  status: string
  paymentStatus: string
  fulfillment: string
  total: number
  createdAt: string
  itemCount: number
}

interface NotificationRow {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
  order?: { orderNumber: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  AWAITING_PAYMENT: 'bg-amber-100 text-amber-800',
  PAYMENT_UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  PAYMENT_CONFIRMED: 'bg-green-100 text-green-800',
  ORDER_RECEIVED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY_FOR_PICKUP: 'bg-green-100 text-green-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function AccountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const load = useCallback(async () => {
    const meRes = await fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.json()).catch(() => null)
    if (!meRes?.user) {
      setMe({ user: null })
      setLoading(false)
      return
    }
    setMe(meRes)
    const [ordersRes, notifRes] = await Promise.all([
      fetch('/api/account/orders', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      fetch('/api/account/notifications', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    ])
    if (ordersRes?.ok) setOrders(ordersRes.orders)
    if (notifRes?.ok) setNotifications(notifRes.notifications)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.json()).catch(() => null)
      if (cancelled) return
      if (!meRes?.user) {
        setMe({ user: null })
        setLoading(false)
        return
      }
      setMe(meRes)
      const [ordersRes, notifRes] = await Promise.all([
        fetch('/api/account/orders', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/account/notifications', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      ])
      if (cancelled) return
      if (ordersRes?.ok) setOrders(ordersRes.orders)
      if (notifRes?.ok) setNotifications(notifRes.notifications)
      setLoading(false)
    }
    run()
    const t = setInterval(run, 20000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  async function markAllRead() {
    await fetch('/api/account/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))
    toast({ title: 'All updates marked as read' })
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Loading your account…</div>
  }

  if (!me?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-lg font-semibold">Please sign in to view your account.</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/account/login" className="btn-brand inline-flex h-11 items-center px-6">
            Sign in
          </Link>
          <Link href="/account/register" className="inline-flex h-11 items-center rounded-full border border-border px-6 font-semibold">
            Create account
          </Link>
        </div>
      </div>
    )
  }

  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">
            Ciao, <span className="text-[#C20E0E]">{me.user.name.split(' ')[0]}</span>!
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{me.user.email}</p>
        </div>
        <div className="flex gap-2">
          {(me.user.role === 'OWNER' || me.user.role === 'MANAGER') && (
            <Link href="/admin">
              <Button variant="outline" className="h-10">
                Staff dashboard
              </Button>
            </Link>
          )}
          <Button variant="outline" className="h-10" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden /> Sign out
          </Button>
        </div>
      </div>

      {/* Inbox */}
      <section className="mt-8" aria-labelledby="inbox-h">
        <div className="flex items-center justify-between">
          <h2 id="inbox-h" className="flex items-center gap-2 text-xl font-bold">
            <Bell className="h-5 w-5 text-[#C20E0E]" aria-hidden /> Updates
            {unread > 0 && <span className="rounded-full bg-[#C20E0E] px-2 py-0.5 text-xs font-bold text-white">{unread} new</span>}
          </h2>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
              <MailOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Mark all read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No updates yet — order updates will appear here automatically.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className={`rounded-xl border p-4 ${n.read ? 'border-border bg-white' : 'border-[#C20E0E]/30 bg-red-50/40'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  </div>
                  {n.order && (
                    <Link href={`/track/${n.order.orderNumber}`} className="shrink-0 text-xs font-semibold text-[#C20E0E] hover:underline">
                      View order →
                    </Link>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Orders */}
      <section className="mt-8" aria-labelledby="orders-h">
        <h2 id="orders-h" className="flex items-center gap-2 text-xl font-bold">
          <PackageSearch className="h-5 w-5 text-[#C20E0E]" aria-hidden /> Your orders
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No orders yet.{' '}
            <Link href="/menu" className="font-semibold text-[#C20E0E] hover:underline">
              Browse the menu
            </Link>{' '}
            to place your first order.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {orders.map((o) => (
              <li key={o.orderNumber} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
                <div>
                  <p className="font-mono text-sm font-bold">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'} · {o.fulfillment === 'DELIVERY' ? 'Delivery' : 'Pickup'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLORS[o.status] ?? 'bg-secondary'}`}>
                    {o.status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <span className="text-sm font-bold">{fmt(o.total)}</span>
                  <ReorderButton orderNumber={o.orderNumber} className="h-9 px-4 text-xs" />
                  <Link
                    href={`/track/${o.orderNumber}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    <RefreshCcw className="h-3 w-3 rotate-90" aria-hidden /> Track
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

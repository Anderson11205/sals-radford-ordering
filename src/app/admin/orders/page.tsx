'use client'

// Admin orders — list, filter, detail dialog, status transitions
import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { fmt } from '@/lib/menu-types'

interface OrderRow {
  id: string
  orderNumber: string
  customerName: string
  phone: string
  status: string
  paymentStatus: string
  paymentMethod: string
  fulfillment: string
  total: number
  createdAt: string
  itemCount: number
  pendingPayments: number
}

interface OrderDetail extends OrderRow {
  email: string | null
  address: string | null
  orderNotes: string | null
  allergyNotes: string | null
  subtotal: number
  taxAmount: number
  deliveryFee: number
  items: { id: string; name: string; variantName: string | null; unitPrice: number; quantity: number; selections: string | null; notes: string | null; lineTotal: number }[]
  payments: { id: string; reference: string; status: string; submittedAt: string; reviewedByName: string | null }[]
}

const STATUSES = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'AWAITING_PAYMENT', label: 'Awaiting payment' },
  { value: 'PAYMENT_UNDER_REVIEW', label: 'Payment under review' },
  { value: 'PAYMENT_CONFIRMED', label: 'Payment confirmed' },
  { value: 'ORDER_RECEIVED', label: 'Order received' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for pickup' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

// Allowed transitions per fulfillment method
function nextStatuses(order: OrderDetail): { value: string; label: string }[] {
  const common = [
    { value: 'PREPARING', label: 'Start preparing' },
    { value: 'COMPLETED', label: 'Mark completed' },
    { value: 'CANCELLED', label: 'Cancel order' },
  ]
  if (order.fulfillment === 'DELIVERY') {
    return [{ value: 'OUT_FOR_DELIVERY', label: 'Send out for delivery' }, ...common]
  }
  return [{ value: 'READY_FOR_PICKUP', label: 'Mark ready for pickup' }, ...common]
}

function OrdersInner() {
  const params = useSearchParams()
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [status, setStatus] = useState(params.get('status') ?? 'ALL')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    const apiStatus = status === 'ALL' ? '' : status
    const res = await fetch(`/api/admin/orders?status=${encodeURIComponent(apiStatus)}&q=${encodeURIComponent(q)}&page=${page}`, { cache: 'no-store' })
    const d = await res.json()
    if (d.ok) {
      setOrders(d.orders)
      setTotal(d.total)
      setPages(d.pages)
    }
    setLoading(false)
  }, [status, q, page])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const apiStatus = status === 'ALL' ? '' : status
      const res = await fetch(`/api/admin/orders?status=${encodeURIComponent(apiStatus)}&q=${encodeURIComponent(q)}&page=${page}`, { cache: 'no-store' }).catch(() => null)
      if (!res || cancelled) return
      const d = await res.json()
      if (cancelled) return
      if (d.ok) {
        setOrders(d.orders)
        setTotal(d.total)
        setPages(d.pages)
      }
      setLoading(false)
    }
    run()
    const t = setInterval(run, 15000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [status, q, page])

  async function openDetail(id: string) {
    const res = await fetch(`/api/admin/orders/${id}`, { cache: 'no-store' })
    const d = await res.json()
    if (d.ok) setDetail(d.order)
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(true)
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const d = await res.json()
    setUpdating(false)
    if (d.ok) {
      toast({ title: 'Order updated', description: `Status is now ${newStatus.replaceAll('_', ' ').toLowerCase()}. Customer has been notified.` })
      setDetail(null)
      load()
    } else {
      toast({ title: 'Could not update', description: d.error, variant: 'destructive' })
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, name or phone…" className="pl-9" aria-label="Search orders" />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#C20E0E]" aria-label="Loading orders" />
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No orders match. New orders appear here automatically.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 font-semibold">Order</th>
                <th className="px-3 py-2.5 font-semibold">Customer</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Payment</th>
                <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-secondary/40">
                  <td className="px-3 py-2.5">
                    <p className="font-mono text-xs font-bold">{o.orderNumber}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{o.customerName}</p>
                    <p className="text-[11px] text-muted-foreground">{o.phone}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{o.fulfillment === 'DELIVERY' ? 'Delivery' : 'Pickup'}</td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">{o.status.replaceAll('_', ' ').toLowerCase()}</span>
                    {o.pendingPayments > 0 && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{o.pendingPayments} payment{o.pendingPayments === 1 ? '' : 's'}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[11px]">
                    {o.paymentStatus === 'CONFIRMED' ? (
                      <span className="font-semibold text-green-700">Confirmed</span>
                    ) : o.paymentStatus === 'UNDER_REVIEW' ? (
                      <span className="font-semibold text-amber-700">Under review</span>
                    ) : o.paymentStatus === 'PAY_ON_SITE' ? (
                      <span className="text-muted-foreground">Pay on site</span>
                    ) : (
                      <span className="text-muted-foreground">Unpaid</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold">{fmt(o.total)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => openDetail(o.id)}>
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page} of {pages} · {total} orders
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono">{detail.orderNumber}</span>
                  <span className="text-lg text-[#C20E0E]">{fmt(detail.total)}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="font-semibold">{detail.customerName}</p>
                  <p className="text-xs text-muted-foreground">{detail.phone}{detail.email ? ` · ${detail.email}` : ''}</p>
                  <p className="mt-1 text-xs font-semibold">{detail.fulfillment === 'DELIVERY' ? `DELIVERY → ${detail.address}` : 'PICKUP'}</p>
                </div>
                <div className="rounded-lg bg-secondary p-3 text-xs">
                  <p>
                    <strong>Payment:</strong> {detail.paymentMethod === 'BANK_TRANSFER' ? 'Bank transfer' : 'On site'} — {detail.paymentStatus.toLowerCase().replaceAll('_', ' ')}
                  </p>
                  <p className="mt-1">
                    <strong>Placed:</strong> {new Date(detail.createdAt).toLocaleString()}
                  </p>
                  {detail.orderNotes && <p className="mt-1"><strong>Notes:</strong> {detail.orderNotes}</p>}
                  {detail.allergyNotes && <p className="mt-1 rounded bg-amber-100 p-1.5 font-semibold text-amber-900">ALLERGY: {detail.allergyNotes}</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold">Items</h3>
                <ul className="mt-1.5 space-y-1.5">
                  {detail.items.map((i) => {
                    let selections: { name: string; price: number }[] = []
                    try {
                      selections = JSON.parse(i.selections ?? '[]')
                    } catch {}
                    return (
                      <li key={i.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-2.5 text-sm">
                        <div>
                          <p className="font-medium">
                            {i.quantity} × {i.name} {i.variantName ? `(${i.variantName})` : ''}
                          </p>
                          {selections.length > 0 && <p className="text-xs text-muted-foreground">{selections.map((s) => `${s.name}${s.price > 0 ? ` (+$${s.price.toFixed(2)})` : ''}`).join(', ')}</p>}
                          {i.notes && <p className="text-xs italic text-muted-foreground">Note: {i.notes}</p>}
                        </div>
                        <span className="font-semibold">{fmt(i.lineTotal)}</span>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-2 space-y-0.5 border-t border-border pt-2 text-right text-sm">
                  <p className="text-muted-foreground">Subtotal {fmt(detail.subtotal)}</p>
                  {detail.taxAmount > 0 && <p className="text-muted-foreground">Tax {fmt(detail.taxAmount)}</p>}
                  {detail.deliveryFee > 0 && <p className="text-muted-foreground">Delivery {fmt(detail.deliveryFee)}</p>}
                  <p className="font-bold">Total {fmt(detail.total)}</p>
                </div>
              </div>

              {detail.payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold">Payment submissions</h3>
                  <ul className="mt-1.5 space-y-1.5">
                    {detail.payments.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary p-2.5 text-sm">
                        <span className="font-mono text-xs">{p.reference}</span>
                        <span className={`text-xs font-semibold ${p.status === 'CONFIRMED' ? 'text-green-700' : p.status === 'REJECTED' ? 'text-red-700' : 'text-amber-700'}`}>{p.status.replaceAll('_', ' ').toLowerCase()}</span>
                        {p.reviewedByName && <span className="text-[11px] text-muted-foreground">by {p.reviewedByName}</span>}
                      </li>
                    ))}
                  </ul>
                  <Link href="/admin/payments" className="mt-1.5 inline-block text-xs font-semibold text-[#C20E0E] hover:underline">
                    Review pending payments →
                  </Link>
                </div>
              )}

              {/* Status actions */}
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {nextStatuses(detail).map((s) => (
                  <Button key={s.value} size="sm" className={s.value === 'CANCELLED' ? 'border border-red-300 bg-white text-red-700 hover:bg-red-50' : 'btn-brand'} onClick={() => updateStatus(detail.id, s.value)} disabled={updating}>
                    {s.label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C20E0E]" /></div>}>
      <OrdersInner />
    </Suspense>
  )
}

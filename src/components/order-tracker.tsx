'use client'

// Order tracking — used by confirmation page and /track/[orderNumber]
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Clock, ChefHat, Bike, PackageCheck, XCircle, Loader2, AlertTriangle, Landmark, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ReorderButton } from '@/components/reorder-button'
import { useToast } from '@/hooks/use-toast'
import { fmt } from '@/lib/menu-types'

const STEPS = [
  { key: 'ORDER_RECEIVED', label: 'Order received', icon: Check },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { key: 'READY_FOR_PICKUP', label: 'Ready for pickup', icon: PackageCheck },
  { key: 'COMPLETED', label: 'Completed', icon: Check },
]

const DELIVERY_STEPS = [
  { key: 'ORDER_RECEIVED', label: 'Order received', icon: Check },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery', icon: Bike },
  { key: 'COMPLETED', label: 'Completed', icon: Check },
]

const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: 'Awaiting payment',
  UNDER_REVIEW: 'Payment under review',
  CONFIRMED: 'Payment confirmed',
  PAY_ON_SITE: 'Pay on pickup / delivery',
}

interface OrderData {
  orderNumber: string
  customerName: string
  fulfillment: string
  address: string | null
  status: string
  paymentStatus: string
  paymentMethod: string
  subtotal: number
  taxAmount: number
  deliveryFee: number
  total: number
  orderNotes: string | null
  allergyNotes: string | null
  createdAt: string
  items: { id: string; name: string; variantName: string | null; quantity: number; unitPrice: number; selections: string | null; notes: string | null; lineTotal: number }[]
  payments: { id: string; reference: string; status: string; submittedAt: string; reviewedAt: string | null }[]
  notifications: { id: string; title: string; body: string; createdAt: string }[]
}

interface Props {
  orderNumber: string
  accessToken?: string
}

/** One copyable bank-detail row for the transfer card. */
function BankDetailRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — value is still fully visible
    }
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm font-semibold">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-secondary"
      >
        {copied ? <Check className="h-4 w-4 text-[#3D8B37]" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  )
}

export function OrderTracker({ orderNumber, accessToken }: Props) {
  const { toast } = useToast()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [payRef, setPayRef] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')
  const [bankDetails, setBankDetails] = useState<{ bankName?: string; bankAccountName?: string; bankAccountNumber?: string }>({})

  useEffect(() => {
    let cancelled = false
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.ok) return
        setBankDetails({
          bankName: d.settings.bankName,
          bankAccountName: d.settings.bankAccountName,
          bankAccountNumber: d.settings.bankAccountNumber,
        })
      })
      .catch(() => null)
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const url = accessToken ? `/api/orders/${orderNumber}?t=${accessToken}` : `/api/orders/${orderNumber}`
    function load() {
      fetch(url, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return
          if (d.ok) setOrder(d.order)
          else setError(d.error ?? 'Could not load the order.')
        })
        .catch(() => !cancelled && setError('Network problem — could not load the order.'))
    }
    load()
    const t = setInterval(load, 15000) // live updates every 15s
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [orderNumber, accessToken])

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault()
    setSubmittingPayment(true)
    try {
      const res = await fetch('/api/payment-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, token: accessToken, reference: payRef, amount: payAmount ? parseFloat(payAmount) : undefined, note: payNote }),
      })
      const d = await res.json()
      if (d.ok) {
        toast({ title: 'Payment submitted', description: 'Your payment reference is now under review by the restaurant.' })
        setPayRef('')
        setPayAmount('')
        setPayNote('')
      } else {
        toast({ title: 'Could not submit', description: d.error ?? 'Please try again.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network problem', description: 'Your submission did not go through. Please try again.', variant: 'destructive' })
    }
    setSubmittingPayment(false)
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" aria-hidden />
        <p className="mt-3 font-semibold">{error}</p>
        <Link href="/track" className="btn-brand mt-5 inline-flex h-10 items-center px-5 text-sm">
          Try another order
        </Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex justify-center py-20" aria-busy>
        <Loader2 className="h-8 w-8 animate-spin text-[#C20E0E]" aria-label="Loading order" />
      </div>
    )
  }

  const isDelivery = order.fulfillment === 'DELIVERY'
  const steps = isDelivery ? DELIVERY_STEPS : STEPS
  const cancelled = order.status === 'CANCELLED'
  const paymentFirst = ['AWAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW', 'PAYMENT_CONFIRMED'].includes(order.status)
  const currentIdx = paymentFirst ? -1 : steps.findIndex((s) => s.key === order.status)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Status card */}
      <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Order</p>
            <h1 className="text-2xl font-extrabold">{order.orderNumber}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-2xl font-extrabold text-[#C20E0E]">{fmt(order.total)}</p>
          </div>
        </div>

        {cancelled ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4" role="alert">
            <XCircle className="h-6 w-6 text-red-600" aria-hidden />
            <div>
              <p className="font-semibold text-red-800">This order was cancelled.</p>
              <p className="text-sm text-red-700">If you did not request this, call us at (540) 639-9669.</p>
            </div>
          </div>
        ) : (
          <ol className="mt-6 flex items-start" aria-label="Order progress">
            {steps.map((step, i) => {
              const done = paymentFirst ? i === 0 && order.status === 'PAYMENT_CONFIRMED' : i < currentIdx
              const active = paymentFirst ? i === 0 && order.status === 'PAYMENT_CONFIRMED' : i === currentIdx
              const Icon = step.icon
              return (
                <li key={step.key} className={`flex-1 ${i < steps.length - 1 ? 'relative' : ''}`}>
                  {i < steps.length - 1 && <div className={`absolute left-1/2 top-4 h-0.5 w-full ${done ? 'bg-[#3D8B37]' : 'bg-border'}`} aria-hidden />}
                  <div className="relative flex flex-col items-center text-center">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        active ? 'border-[#C20E0E] bg-[#C20E0E] text-white' : done ? 'border-[#3D8B37] bg-[#3D8B37] text-white' : 'border-border bg-white text-muted-foreground'
                      }`}
                      aria-current={active ? 'step' : undefined}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className={`mt-1.5 text-[11px] font-medium sm:text-xs ${active ? 'text-[#C20E0E]' : done ? 'text-[#3D8B37]' : 'text-muted-foreground'}`}>{step.label}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        {paymentFirst && !cancelled && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4" role="status">
            <Clock className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <p className="text-sm text-amber-900">
              {order.status === 'AWAITING_PAYMENT' && 'Your order is saved. Transfer the total to the account below, then tap “I have paid” to begin review.'}
              {order.status === 'PAYMENT_UNDER_REVIEW' && 'Your payment reference was received — the restaurant is reviewing it now.'}
              {order.status === 'PAYMENT_CONFIRMED' && 'Payment confirmed! The kitchen is getting your order ready.'}
            </p>
          </div>
        )}

        {/* Payment status chip */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            order.paymentStatus === 'CONFIRMED' ? 'bg-green-100 text-green-800' : order.paymentStatus === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' : 'bg-secondary text-foreground/80'
          }`}>
            <Landmark className="h-3.5 w-3.5" aria-hidden /> {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{isDelivery ? 'Delivery' : 'Pickup'}</span>
        </div>
      </div>

      {/* Bank transfer — account details + "I have paid" confirmation */}
      {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'CONFIRMED' && (
        <div className="mt-4 space-y-4">
          {(bankDetails.bankAccountName || bankDetails.bankAccountNumber) && (
            <div className="rounded-2xl border-2 border-[#C20E0E]/25 bg-[#fdf8f3] p-5">
              <h2 className="flex items-center gap-2 font-bold">
                <Landmark className="h-4 w-4 text-[#C20E0E]" aria-hidden />
                Pay by bank transfer — send {fmt(order.total)} to this account
              </h2>
              <div className="mt-3 space-y-2">
                {bankDetails.bankName && <BankDetailRow label="Bank" value={bankDetails.bankName} />}
                {bankDetails.bankAccountName && <BankDetailRow label="Account name" value={bankDetails.bankAccountName} />}
                {bankDetails.bankAccountNumber && <BankDetailRow label="Account number" value={bankDetails.bankAccountNumber} />}
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Amount (order {order.orderNumber})</p>
                    <p className="font-mono text-sm font-bold text-[#C20E0E]">{fmt(order.total)}</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Use your order number <span className="font-mono font-semibold">{order.orderNumber}</span> as the transfer
                note if possible — it helps the restaurant match your payment faster.
              </p>
            </div>
          )}
          <form onSubmit={submitPayment} className="rounded-2xl border border-border bg-white p-5">
            <h2 className="font-bold">Confirm you have paid</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paid the transfer already? Enter the transaction reference / transfer note so the restaurant can verify your
              payment. This does not confirm payment by itself — the restaurant checks the bank and confirms it manually.
            </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pay-ref">Transaction reference *</Label>
              <Input id="pay-ref" value={payRef} onChange={(e) => setPayRef(e.target.value)} required maxLength={160} className="mt-1" placeholder="e.g. TRX-84821 or last 4 digits + time" />
            </div>
            <div>
              <Label htmlFor="pay-amount">Amount transferred (optional)</Label>
              <Input id="pay-amount" type="number" step="0.01" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="mt-1" placeholder={order.total.toFixed(2)} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="pay-note">Note (optional)</Label>
              <Textarea id="pay-note" value={payNote} onChange={(e) => setPayNote(e.target.value.slice(0, 400))} className="mt-1 min-h-[56px]" />
            </div>
          </div>
          <Button type="submit" className="btn-brand mt-3 h-11 w-full" disabled={submittingPayment || !payRef.trim()}>
            {submittingPayment ? 'Sending…' : 'I have paid — send for review'}
          </Button>
          {order.payments.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <h3 className="text-sm font-semibold">Payment submissions</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
                    <span className="font-mono text-xs">{p.reference}</span>
                    <span className={`text-xs font-semibold ${p.status === 'CONFIRMED' ? 'text-green-700' : p.status === 'REJECTED' ? 'text-red-700' : 'text-amber-700'}`}>
                      {p.status === 'UNDER_REVIEW' ? 'Under review' : p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          </form>
        </div>
      )}

      {/* Items */}
      <div className="mt-4 rounded-2xl border border-border bg-white p-5">
        <h2 className="font-bold">Your items</h2>
        <ul className="mt-3 space-y-3">
          {order.items.map((item) => {
            let selections: { name: string; price: number }[] = []
            try {
              selections = JSON.parse(item.selections ?? '[]')
            } catch {}
            return (
              <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">
                    {item.quantity} × {item.name}
                    {item.variantName ? ` (${item.variantName})` : ''}
                  </p>
                  {selections.length > 0 && <p className="text-xs text-muted-foreground">{selections.map((s) => s.name).join(', ')}</p>}
                  {item.notes && <p className="text-xs italic text-muted-foreground">“{item.notes}”</p>}
                </div>
                <span className="font-medium">{fmt(item.lineTotal)}</span>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{fmt(order.subtotal)}</span>
          </div>
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>{fmt(order.taxAmount)}</span>
            </div>
          )}
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span>{fmt(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{fmt(order.total)}</span>
          </div>
        </div>

        {/* Reorder — rebuilds this order in the cart at today's prices */}
        {!cancelled && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#C20E0E]/20 bg-red-50/40 p-4">
            <div>
              <p className="text-sm font-semibold">Loved it? Order it again.</p>
              <p className="text-xs text-muted-foreground">We&apos;ll rebuild this order with today&apos;s prices and re-check every item.</p>
            </div>
            <ReorderButton orderNumber={order.orderNumber} accessToken={accessToken} label="Reorder" />
          </div>
        )}
        {isDelivery && order.address && (
          <p className="mt-3 text-sm text-muted-foreground">
            <strong className="text-foreground">Delivering to:</strong> {order.address}
          </p>
        )}
        {order.allergyNotes && (
          <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
            <strong>Allergy note on file:</strong> {order.allergyNotes} — the kitchen has been told, but please confirm serious allergies by phone.
          </p>
        )}
      </div>

      {/* Updates */}
      {order.notifications.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="font-bold">Updates about your order</h2>
          <ul className="mt-3 space-y-3">
            {order.notifications.map((n) => (
              <li key={n.id} className="rounded-lg bg-secondary p-3">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Questions about this order? Call Sal&apos;s at{' '}
        <a href="tel:+15406399669" className="font-semibold text-[#C20E0E] hover:underline">
          (540) 639-9669
        </a>
        . This page updates automatically every 15 seconds.
      </p>
    </div>
  )
}

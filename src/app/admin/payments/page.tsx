'use client'

// Payment review — verify or reject bank transfer submissions (manager/owner)
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Landmark, ShieldCheck, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { fmt } from '@/lib/menu-types'

interface PaymentRow {
  id: string
  reference: string
  amount: number | null
  note: string | null
  status: string
  submittedAt: string
  order: { orderNumber: string; total: number; customerName: string; phone: string }
}

export default function AdminPaymentsPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [reviewing, setReviewing] = useState<PaymentRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    // Under-review payments are surfaced via orders endpoint filter
    const res = await fetch('/api/admin/payments-list', { cache: 'no-store' }).catch(() => null)
    if (res) {
      const d = await res.json()
      if (d.ok) setRows(d.payments)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const res = await fetch('/api/admin/payments-list', { cache: 'no-store' }).catch(() => null)
      if (!res || cancelled) return
      const d = await res.json()
      if (cancelled) return
      if (d.ok) setRows(d.payments)
      setLoading(false)
    }
    run()
    const t = setInterval(run, 15000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  async function decide(id: string, decision: 'CONFIRMED' | 'REJECTED') {
    setBusyId(id)
    const res = await fetch(`/api/admin/payments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, note }),
    })
    const d = await res.json()
    setBusyId(null)
    setNote('')
    setReviewing(null)
    if (d.ok) {
      toast({ title: decision === 'CONFIRMED' ? 'Payment confirmed' : 'Payment rejected', description: 'The customer has been notified and the record includes your name and time.' })
      setRows((rs) => rs.filter((r) => r.id !== id))
    } else {
      toast({ title: 'Could not record decision', description: d.error, variant: 'destructive' })
    }
  }

  return (
    <div>
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="note">
        <p className="font-semibold">A submitted reference or receipt is NOT proof of payment.</p>
        <p className="mt-0.5">Verify the transfer in your bank account before confirming. Every decision is recorded with your name and the exact time.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#C20E0E]" aria-label="Loading payments" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No payment submissions awaiting review. New submissions appear here automatically.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    <Landmark className="h-4 w-4 text-[#C20E0E]" aria-hidden />
                    <span className="font-mono text-sm">{p.reference}</span>
                    {p.amount != null && <span className="text-sm font-bold text-[#C20E0E]">{fmt(p.amount)}</span>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Order <span className="font-mono font-semibold">{p.order.orderNumber}</span> · {p.order.customerName} · {p.order.phone} · order total {fmt(p.order.total)}
                  </p>
                  {p.note && <p className="mt-1 text-xs italic text-muted-foreground">Customer note: “{p.note}”</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">Submitted {new Date(p.submittedAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="btn-brand" onClick={() => setReviewing(p)}>
                    <ShieldCheck className="mr-1.5 h-4 w-4" aria-hidden /> Review
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!reviewing} onOpenChange={(v) => !v && setReviewing(null)}>
        <DialogContent className="max-w-md">
          {reviewing && (
            <>
              <DialogHeader>
                <DialogTitle>Verify payment — {reviewing.order.orderNumber}</DialogTitle>
              </DialogHeader>
              <div className="rounded-lg bg-secondary p-3 text-sm">
                <p>
                  <strong>Reference:</strong> <span className="font-mono">{reviewing.reference}</span>
                </p>
                <p className="mt-1">
                  <strong>Expected total:</strong> {fmt(reviewing.order.total)} {reviewing.amount != null && <>(customer claims {fmt(reviewing.amount)})</>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Check your bank statement / deposit record for this reference before deciding.</p>
              </div>
              <Textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} placeholder="Internal note (sent to customer if rejected)…" />
              <div className="flex gap-2">
                <Button className="btn-brand flex-1" onClick={() => decide(reviewing.id, 'CONFIRMED')} disabled={busyId === reviewing.id}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" aria-hidden /> Confirm payment
                </Button>
                <Button variant="outline" className="flex-1 border-red-300 text-red-700 hover:bg-red-50" onClick={() => decide(reviewing.id, 'REJECTED')} disabled={busyId === reviewing.id}>
                  <ShieldX className="mr-1.5 h-4 w-4" aria-hidden /> Cannot verify
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

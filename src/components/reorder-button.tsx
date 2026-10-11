'use client'

// Reorder — rebuilds a past order into the cart at TODAY'S menu prices.
// The server resolves old snapshots against the current menu; lines that no
// longer exist (or options that were removed) are reported honestly.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useCart, type CartLine } from '@/lib/cart-store'

interface Props {
  orderNumber: string
  accessToken?: string
  className?: string
  label?: string
}

interface ReorderResponse {
  ok: boolean
  error?: string
  message?: string
  lines?: Omit<CartLine, 'lineId'>[]
  unavailable?: { name: string; reason: string }[]
  droppedOptions?: { itemName: string; option: string }[]
  sizeChanged?: string[]
}

export function ReorderButton({ orderNumber, accessToken, className = '', label = 'Reorder' }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const addLine = useCart((s) => s.addLine)
  const [loading, setLoading] = useState(false)

  async function handleReorder() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/orders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, accessToken }),
      })
      const d: ReorderResponse = await res.json()

      if (!d.ok) {
        toast({ title: 'Could not reorder', description: d.error ?? 'Please try again.', variant: 'destructive' })
        setLoading(false)
        return
      }

      const lines = d.lines ?? []
      if (lines.length === 0) {
        const why = (d.unavailable ?? []).map((u) => `${u.name} — ${u.reason}`).join(' · ')
        toast({
          title: 'Nothing could be re-ordered',
          description: d.message ?? why ?? 'These items are not available right now.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      for (const line of lines) addLine(line)

      // Build an honest summary of anything that changed
      const notes: string[] = []
      const unavail = d.unavailable ?? []
      if (unavail.length > 0) notes.push(`Not available anymore: ${unavail.map((u) => u.name).join(', ')}`)
      const dropped = d.droppedOptions ?? []
      if (dropped.length > 0) {
        const uniq = [...new Set(dropped.map((x) => x.option))]
        if (uniq.length > 0) notes.push(`Removed options no longer offered: ${uniq.join(', ')}`)
      }
      const sized = d.sizeChanged ?? []
      if (sized.length > 0) {
        const uniq = [...new Set(sized)]
        notes.push(`Size no longer offered — default size used for: ${uniq.join(', ')}`)
      }
      notes.push('Prices updated to today\u2019s menu.')

      toast({
        title: `${lines.reduce((a, l) => a + l.quantity, 0)} item${lines.reduce((a, l) => a + l.quantity, 0) === 1 ? '' : 's'} added to your cart`,
        description: notes.join(' · '),
      })
      router.push('/cart')
    } catch {
      toast({
        title: 'Network problem',
        description: 'Your reorder did not go through. Please try again.',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }

  return (
    <Button className={`btn-brand ${className}`} onClick={handleReorder} disabled={loading} aria-label={`Reorder items from order ${orderNumber}`}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <RefreshCcw className="mr-2 h-4 w-4" aria-hidden />}
      {loading ? 'Adding…' : label}
    </Button>
  )
}

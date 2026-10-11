'use client'

// /track — look up an order by number + phone
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TrackPage() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      })
      const d = await res.json()
      if (d.ok) {
        router.push(`/track/${d.orderNumber}?t=${d.accessToken}`)
      } else {
        setError(d.error ?? 'Lookup failed.')
      }
    } catch {
      setError('Network problem — please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold text-center">
        Track your <span className="text-[#C20E0E]">order</span>
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Enter your order number and the phone number you used when ordering.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-white p-5">
        <div>
          <Label htmlFor="tr-num">Order number *</Label>
          <Input id="tr-num" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} placeholder="SLS-XXXXXX" className="mt-1 font-mono" required />
        </div>
        <div>
          <Label htmlFor="tr-phone">Phone number *</Label>
          <Input id="tr-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(540) 555-0100" className="mt-1" required />
        </div>
        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="btn-brand h-11 w-full" disabled={loading || !orderNumber.trim() || phone.trim().length < 4}>
          {loading ? 'Looking up…' : 'Find my order'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Signed in?{' '}
        <Link href="/account" className="font-semibold text-[#C20E0E] hover:underline">
          View all your orders
        </Link>
      </p>
    </div>
  )
}

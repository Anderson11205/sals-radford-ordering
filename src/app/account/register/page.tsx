'use client'

// Create a customer account (optional — guest checkout stays available)
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      })
      const d = await res.json()
      if (d.ok) {
        router.push('/account')
        router.refresh()
      } else {
        setError(d.error ?? 'Registration failed.')
      }
    } catch {
      setError('Network problem — please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold text-center">
        Join the <span className="text-[#C20E0E]">family</span>
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Create an account to keep your orders, reorder your favorites, and get updates in one place.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-white p-5">
        <div>
          <Label htmlFor="rg-name">Full name</Label>
          <Input id="rg-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="rg-email">Email</Label>
          <Input id="rg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="rg-phone">Phone (optional)</Label>
          <Input id="rg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" autoComplete="tel" />
        </div>
        <div>
          <Label htmlFor="rg-pass">Password (8+ characters)</Label>
          <Input id="rg-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" autoComplete="new-password" minLength={8} required />
        </div>
        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="btn-brand h-11 w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/account/login" className="font-semibold text-[#C20E0E] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

'use client'

// Sign in
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/account'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const d = await res.json()
      if (d.ok) {
        router.push(d.user.role === 'CUSTOMER' ? next : '/admin')
        router.refresh()
      } else {
        setError(d.error ?? 'Sign-in failed.')
      }
    } catch {
      setError('Network problem — please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold text-center">
        Welcome <span className="text-[#C20E0E]">back</span>
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">Sign in to see your orders and updates.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-white p-5">
        <div>
          <Label htmlFor="li-email">Email</Label>
          <Input id="li-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="li-pass">Password</Label>
          <Input id="li-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" autoComplete="current-password" required />
        </div>
        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="btn-brand h-11 w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/account/register" className="font-semibold text-[#C20E0E] hover:underline">
          Create an account
        </Link>{' '}
        — or keep browsing, guest checkout is always available.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}

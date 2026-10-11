'use client'

// One-time secure owner setup — only available before any owner account exists
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetupPage() {
  const router = useRouter()
  const [available, setAvailable] = useState<boolean | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/setup')
      .then((r) => r.json())
      .then((d) => {
        setAvailable(d.setupAvailable)
        setOwnerEmail(d.ownerEmail)
      })
      .catch(() => setAvailable(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: ownerEmail, password }),
      })
      const d = await res.json()
      if (d.ok) {
        router.push('/admin')
        router.refresh()
      } else setError(d.error ?? 'Setup failed.')
    } catch {
      setError('Network problem — please try again.')
    }
    setSubmitting(false)
  }

  if (available === null) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-[#C20E0E]" aria-label="Checking setup status" />
      </div>
    )
  }

  if (!available) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-[#3D8B37]" aria-hidden />
        <p className="mt-3 text-lg font-semibold">Setup is already complete.</p>
        <p className="mt-1 text-sm text-muted-foreground">The owner account exists. Sign in to reach the dashboard.</p>
        <a href="/account/login?next=/admin" className="btn-brand mt-5 inline-flex h-10 items-center px-5 text-sm">
          Sign in
        </a>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-[#C20E0E]" aria-hidden />
        <h1 className="mt-2 text-2xl font-extrabold">Primary owner setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One-time setup — the first owner account must use the primary owner email <strong>{ownerEmail}</strong>. No
          passwords are stored in code; choose a strong private password now.
        </p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-white p-5">
        <div>
          <Label htmlFor="su-name">Your name</Label>
          <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" required />
        </div>
        <div>
          <Label htmlFor="su-email">Owner email (fixed)</Label>
          <Input id="su-email" value={ownerEmail} disabled className="mt-1 bg-secondary" />
        </div>
        <div>
          <Label htmlFor="su-pass">Owner password (10+ characters)</Label>
          <Input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" minLength={10} autoComplete="new-password" required />
        </div>
        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="btn-brand h-11 w-full" disabled={submitting}>
          {submitting ? 'Creating owner account…' : 'Create owner account'}
        </Button>
      </form>
    </div>
  )
}

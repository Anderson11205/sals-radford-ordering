'use client'

// Secure invitation acceptance — single-use link, self-chosen password
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ShieldCheck, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [state, setState] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setEmail(d.email)
          setState('valid')
        } else setState('invalid')
      })
      .catch(() => setState('invalid'))
  }, [token])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      })
      const d = await res.json()
      if (d.ok) {
        router.push('/admin')
        router.refresh()
      } else setError(d.error ?? 'Could not accept the invitation.')
    } catch {
      setError('Network problem — please try again.')
    }
    setSubmitting(false)
  }

  if (state === 'checking') {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-[#C20E0E]" aria-label="Validating invitation" />
      </div>
    )
  }

  if (state === 'invalid') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
        <p className="mt-3 text-lg font-semibold">This invitation link is invalid, expired, or already used.</p>
        <p className="mt-1 text-sm text-muted-foreground">Ask the primary owner to send a fresh invitation link.</p>
        <Link href="/" className="btn-brand mt-5 inline-flex h-10 items-center px-5 text-sm">
          Back to restaurant
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center">
        <MailCheck className="mx-auto h-10 w-10 text-[#3D8B37]" aria-hidden />
        <h1 className="mt-2 text-2xl font-extrabold">Manager invitation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You have been invited to manage <strong>Sal&apos;s Italian Restaurant &amp; Pizzeria</strong> as{' '}
          <span className="font-semibold">{email}</span>.
        </p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-white p-5">
        <div>
          <Label htmlFor="iv-name">Your name</Label>
          <Input id="iv-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" required />
        </div>
        <div>
          <Label htmlFor="iv-phone">Phone (optional)</Label>
          <Input id="iv-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="iv-pass">Choose a password (10+ characters)</Label>
          <Input id="iv-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" minLength={10} autoComplete="new-password" required />
          <p className="mt-1 text-xs text-muted-foreground">Passwords are hashed securely — nobody can read them, not even the owner.</p>
        </div>
        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="btn-brand h-11 w-full" disabled={submitting}>
          {submitting ? 'Setting up your account…' : 'Accept invitation & set up account'}
        </Button>
      </form>
    </div>
  )
}

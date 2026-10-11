'use client'

// Team management (owner) — invite Joe as manager, revoke/resend, suspend/remove
import { useCallback, useEffect, useState } from 'react'
import { Loader2, UserPlus, Copy, Ban, RotateCcw, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Invitation {
  id: string
  email: string
  role: string
  expiresAt: string
  usedAt: string | null
  revokedAt: string | null
  createdAt: string
  token: string
}

interface TeamUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

export default function AdminTeamPage() {
  const { toast } = useToast()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [freshLink, setFreshLink] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [invRes, teamRes] = await Promise.all([
      fetch('/api/admin/invitations', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      fetch('/api/admin/team', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    ])
    if (invRes?.ok) setInvitations(invRes.invitations)
    if (teamRes?.ok) setUsers(teamRes.users)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const [invRes, teamRes] = await Promise.all([
        fetch('/api/admin/invitations', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/admin/team', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      ])
      if (cancelled) return
      if (invRes?.ok) setInvitations(invRes.invitations)
      if (teamRes?.ok) setUsers(teamRes.users)
      setLoading(false)
    }
    run()
  }, [])

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: 'MANAGER' }),
    })
    const d = await res.json()
    setCreating(false)
    if (d.ok) {
      setFreshLink(d.link)
      setEmail('')
      toast({ title: 'Invitation created', description: 'Copy the secure link and send it to the manager privately.' })
      load()
    } else {
      toast({ title: 'Could not invite', description: d.error, variant: 'destructive' })
    }
  }

  async function invitationAction(id: string, action: 'REVOKE' | 'RESEND') {
    const res = await fetch(`/api/admin/invitations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const d = await res.json()
    if (d.ok) {
      if (action === 'RESEND' && d.link) setFreshLink(d.link)
      toast({ title: action === 'REVOKE' ? 'Invitation revoked' : 'New invitation link created' })
      load()
    } else {
      toast({ title: 'Action failed', description: d.error, variant: 'destructive' })
    }
  }

  async function userAction(id: string, action: 'SUSPEND' | 'ACTIVATE' | 'REMOVE') {
    const res = await fetch(`/api/admin/team/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const d = await res.json()
    if (d.ok) {
      toast({ title: 'Done', description: d.note ?? 'Team updated.' })
      load()
    } else {
      toast({ title: 'Action failed', description: d.error, variant: 'destructive' })
    }
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`)
    toast({ title: 'Link copied', description: 'Send it to the manager through a private channel. Never post it publicly.' })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#C20E0E]" aria-label="Loading team" />
      </div>
    )
  }

  const pending = invitations.filter((i) => !i.usedAt && !i.revokedAt && new Date(i.expiresAt) > new Date())

  return (
    <div className="space-y-8">
      {/* Invite */}
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <UserPlus className="h-5 w-5 text-[#C20E0E]" aria-hidden /> Invite a restaurant manager
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Generates a secure single-use link that expires automatically. The manager sets their own password — never send
          passwords in plain text. Managers do not get access to hosting, GitHub, database or API secrets.
        </p>
        <form onSubmit={invite} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="inv-email">Manager email</Label>
            <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joe@salsradford.com" className="mt-1" required />
          </div>
          <Button type="submit" className="btn-brand h-10 px-6" disabled={creating}>
            {creating ? 'Creating…' : 'Create invitation'}
          </Button>
        </form>

        {freshLink && (
          <div className="mt-3 rounded-lg border border-green-300 bg-green-50 p-3">
            <p className="text-sm font-semibold text-green-900">Secure invitation link (copy now — shown once per creation):</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded bg-white p-2 text-xs">{freshLink}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(freshLink); toast({ title: 'Copied' }) }}>
                <Copy className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}

        {/* Pending invitations */}
        {pending.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-bold">Pending invitations</h3>
            <ul className="mt-2 space-y-2">
              {pending.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary p-3 text-sm">
                  <div>
                    <p className="font-medium">{i.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(i.expiresAt).toLocaleString()} · created {new Date(i.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => copyLink(i.token)}>
                      <Copy className="mr-1 h-3.5 w-3.5" aria-hidden /> Copy link
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => invitationAction(i.id, 'RESEND')}>
                      <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden /> Resend (new link)
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => invitationAction(i.id, 'REVOKE')}>
                      <Ban className="mr-1 h-3.5 w-3.5" aria-hidden /> Revoke
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Team members */}
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-bold">Team members</h2>
        <ul className="mt-3 space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
              <div>
                <p className="font-semibold">
                  {u.name}{' '}
                  <Badge variant="outline" className="ml-1 text-[10px]">
                    {u.role}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.status}</span>
                {u.role === 'MANAGER' && u.status === 'ACTIVE' && (
                  <Button size="sm" variant="outline" onClick={() => userAction(u.id, 'SUSPEND')}>
                    <Ban className="mr-1 h-3.5 w-3.5" aria-hidden /> Suspend access
                  </Button>
                )}
                {u.role === 'MANAGER' && u.status === 'SUSPENDED' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => userAction(u.id, 'ACTIVATE')}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden /> Reactivate
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => userAction(u.id, 'REMOVE')}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden /> Remove
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Managers with order history are suspended (not deleted) to preserve records. Owner accounts cannot be modified here.
        </p>
      </section>
    </div>
  )
}

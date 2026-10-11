'use client'

// Admin layout — role-aware nav (owner sees more), server-enforced permissions on every API
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, LayoutDashboard, Settings, ShieldCheck, ScrollText, UtensilsCrossed, Users, Landmark, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BASE_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/payments', label: 'Payments', icon: Landmark },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
]

const OWNER_NAV = [
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/team', label: 'Team', icon: Users },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<{ userId: string; name: string; email: string; role: string } | null | 'loading'>('loading')

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user && (d.user.role === 'OWNER' || d.user.role === 'MANAGER')) setMe(d.user)
        else setMe(null)
      })
      .catch(() => setMe(null))
  }, [])

  if (me === 'loading') {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-[#C20E0E]" aria-label="Checking access" />
      </div>
    )
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
        <p className="mt-3 text-lg font-semibold">Staff access only</p>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with the owner or restaurant manager account.</p>
        <Link href="/account/login?next=/admin" className="btn-brand mt-5 inline-flex h-11 items-center px-6">
          Sign in
        </Link>
      </div>
    )
  }

  const nav = me.role === 'OWNER' ? [...BASE_NAV, ...OWNER_NAV] : BASE_NAV

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C20E0E]">Staff Dashboard</p>
          <h1 className="text-2xl font-extrabold">
            {me.name} <span className="text-sm font-semibold text-muted-foreground">· {me.role === 'OWNER' ? 'Primary Owner' : 'Restaurant Manager'}</span>
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/')
            router.refresh()
          }}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden /> Sign out
        </Button>
      </div>

      <nav className="hide-scrollbar mt-4 flex gap-1.5 overflow-x-auto border-b border-border pb-2" aria-label="Admin sections">
        {nav.map((n) => {
          const active = pathname === n.href
          const Icon = n.icon
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-[#C20E0E] text-white' : 'text-foreground/70 hover:bg-secondary'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden /> {n.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  )
}

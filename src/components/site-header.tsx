'use client'

// Header with Sal's branding — red pill "ORDER NOW" button like the official site
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Phone, Menu as MenuIcon, User, X } from 'lucide-react'
import { useState } from 'react'
import { useCart, cartCount } from '@/lib/cart-store'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/track', label: 'Track Order' },
  { href: '/account', label: 'My Account' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const lines = useCart((s) => s.lines)
  const count = cartCount(lines)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo — authentic red script "S" mark */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0" aria-label="Sal's Italian Restaurant & Pizzeria home">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A1714] text-2xl font-bold text-[#C20E0E] select-none"
              style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
              aria-hidden="true"
            >
              S
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-lg font-bold tracking-tight text-[#C20E0E]" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>
                Sal&apos;s
              </span>
              <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-[#3D8B37]">
                Italian Restaurant &amp; Pizzeria
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  pathname === n.href ? 'bg-secondary text-foreground' : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary"
              aria-label={`Cart with ${count} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C20E0E] px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            <Link
              href="/menu"
              className="btn-brand hidden sm:inline-flex h-10 items-center px-4 text-sm"
            >
              ORDER NOW
            </Link>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary md:hidden"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={drawerOpen}
            >
              {drawerOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <nav className="border-t border-border bg-white px-4 py-3 md:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setDrawerOpen(false)}
              className={`block rounded-lg px-3 py-3 text-base font-medium ${
                pathname === n.href ? 'bg-secondary text-foreground' : 'text-foreground/80'
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link href="/menu" onClick={() => setDrawerOpen(false)} className="btn-brand mt-2 flex h-11 items-center justify-center text-sm">
            ORDER NOW
          </Link>
          <a
            href="tel:+15406399669"
            className="mt-2 flex h-11 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium"
          >
            <Phone className="h-4 w-4" /> Call (540) 639-9669
          </a>
        </nav>
      )}
    </header>
  )
}

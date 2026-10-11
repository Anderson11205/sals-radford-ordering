'use client'

// Homepage — welcoming hero, category shortcuts, real popular items, verified hours & contact
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Clock, ShoppingBag, UtensilsCrossed, Bike, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fmt, type ApiCategory, type ApiMenuItem } from '@/lib/menu-types'
import { useCart } from '@/lib/cart-store'

export default function HomePage() {
  const [categories, setCategories] = useState<ApiCategory[] | null>(null)
  const [popular, setPopular] = useState<ApiMenuItem[]>([])
  const addLine = useCart((s) => s.addLine)

  useEffect(() => {
    let cancelled = false
    fetch('/api/menu')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.ok) return
        setCategories(d.categories)
        const pop: ApiMenuItem[] = []
        for (const c of d.categories as ApiCategory[]) {
          for (const i of c.items) {
            if (i.popular && i.available && !i.pricePending) pop.push(i)
          }
        }
        setPopular(pop.slice(0, 8))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function quickAdd(item: ApiMenuItem) {
    const v = item.variants.find((x) => x.isDefault) ?? item.variants[0]
    addLine({
      menuItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      variantId: v?.id,
      variantName: v?.name,
      basePrice: v ? v.price : item.basePrice ?? 0,
      selections: [],
      quantity: 1,
    })
  }

  return (
    <div>
      {/* Hero */}
      <section className="sals-dark relative overflow-hidden">
        {categories?.length ? (
          <Image src="/images/hero-restaurant.jpg" alt="" fill priority className="object-cover opacity-25" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-[#1A1714]" />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 text-center">
          <p
            className="text-5xl sm:text-7xl font-bold text-[#C20E0E] drop-shadow"
            style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
          >
            Sal&apos;s
          </p>
          <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight">
            <span className="text-[#3D8B37]">ITALIAN</span>{' '}
            <span className="text-white/95 text-lg sm:text-2xl font-semibold">Restaurant &amp; Pizzeria</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-lg text-white/80">
            Since 1978, three generations of homemade recipes from Naples, Italy — served fresh in Radford, Virginia.
            Order online for pickup or delivery and taste the tradition.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/menu" className="btn-brand inline-flex h-12 items-center px-8 text-base font-bold">
              ORDER NOW
            </Link>
            <Link
              href="/menu"
              className="inline-flex h-12 items-center rounded-full border border-white/30 px-8 text-base font-semibold text-white hover:bg-white/10"
            >
              Browse the Menu
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <Store className="h-4 w-4" aria-hidden /> Pickup always available
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bike className="h-4 w-4" aria-hidden /> Delivery once enabled by the restaurant
            </span>
          </div>
        </div>
      </section>

      {/* Category shortcuts */}
      <section className="sals-cream border-b border-border" aria-label="Menu categories">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="text-center text-2xl font-extrabold">
            What are you <span className="text-[#C20E0E]">craving</span>?
          </h2>
          <div className="hide-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible md:grid-cols-4 lg:grid-cols-7">
            {(categories ?? []).slice(0, 8).map((c) => (
              <Link
                key={c.slug}
                href={`/menu#cat-${c.slug}`}
                className="group flex w-32 shrink-0 flex-col items-center rounded-xl border border-[#E8E0D7] bg-white p-3 text-center transition-shadow hover:shadow-md sm:w-auto"
              >
                {c.image && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-secondary">
                    <Image src={c.image} alt="" fill className="object-cover transition-transform group-hover:scale-105" sizes="64px" unoptimized />
                  </div>
                )}
                <span className="mt-2 text-sm font-semibold leading-tight">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.italianName && c.italianName !== c.name ? c.italianName : `${c.items.length} items`}</span>
              </Link>
            ))}
            {!categories &&
              Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-28 w-32 shrink-0 rounded-xl" />)}
          </div>
        </div>
      </section>

      {/* Popular items from the real menu */}
      <section className="mx-auto max-w-6xl px-4 py-10" aria-label="Popular items">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">
            Guest <span className="text-[#C20E0E]">favorites</span>
          </h2>
          <Link href="/menu" className="text-sm font-semibold text-[#C20E0E] hover:underline">
            See full menu →
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((item) => (
            <article key={item.id} className="menu-item-card overflow-hidden rounded-xl border border-border bg-white">
              {item.imageUrl && (
                <div className="relative h-32 w-full bg-secondary">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 25vw" unoptimized />
                </div>
              )}
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-snug">{item.name}</h3>
                  <span className="shrink-0 text-sm font-bold text-[#C20E0E]">
                    {fmt(item.variants.find((v) => v.isDefault)?.price ?? item.basePrice ?? 0)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2.5 h-8 w-full text-xs"
                  onClick={() => (item.modifierGroups.length > 0 ? (window.location.href = '/menu') : quickAdd(item))}
                >
                  <ShoppingBag className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  {item.modifierGroups.length > 0 ? 'Customize in menu' : 'Add to cart'}
                </Button>
              </div>
            </article>
          ))}
          {popular.length === 0 &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-white p-4">
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="mt-3 h-4 w-3/4" />
              </div>
            ))}
        </div>
      </section>

      {/* Info: pickup/delivery + hours + location */}
      <section className="sals-cream border-t border-border" aria-label="Restaurant information">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div className="text-center sm:text-left">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#C20E0E]/10 sm:mx-0">
              <Clock className="h-5 w-5 text-[#C20E0E]" aria-hidden />
            </div>
            <h3 className="mt-3 font-bold">Hours</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Mon, Wed &amp; Thu: 10:30 am – 8:30 pm</li>
              <li>Tuesday: Closed</li>
              <li>Fri &amp; Sat: 10:30 am – 9:00 pm</li>
              <li>Sunday: 11:30 am – 8:30 pm</li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#C20E0E]/10 sm:mx-0">
              <MapPin className="h-5 w-5 text-[#C20E0E]" aria-hidden />
            </div>
            <h3 className="mt-3 font-bold">Find Us</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              709 West Main Street
              <br />
              Radford, Virginia 24141
            </p>
            <a href="tel:+15406399669" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C20E0E] hover:underline">
              <Phone className="h-4 w-4" aria-hidden /> (540) 639-9669
            </a>
          </div>
          <div className="text-center sm:text-left">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#C20E0E]/10 sm:mx-0">
              <UtensilsCrossed className="h-5 w-5 text-[#C20E0E]" aria-hidden />
            </div>
            <h3 className="mt-3 font-bold">Ordering</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Pickup is ready while you wait — pay cash or card at the restaurant, or by bank transfer once the restaurant
              activates it. Track every order right here.
            </p>
            <Link href="/track" className="mt-2 inline-block text-sm font-semibold text-[#C20E0E] hover:underline">
              Track an order →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

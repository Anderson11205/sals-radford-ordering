'use client'

// Menu page — search, category browse, customization modal
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Search, AlertTriangle, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ItemModal } from '@/components/item-modal'
import { fmt, type ApiCategory, type ApiMenuItem } from '@/lib/menu-types'
import { useCart } from '@/lib/cart-store'

export default function MenuPage() {
  const [categories, setCategories] = useState<ApiCategory[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState<string>('all')
  const [modalItem, setModalItem] = useState<ApiMenuItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const addLine = useCart((s) => s.addLine)
  const catNavRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/menu')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.ok) setCategories(d.categories)
        else setError(d.error ?? 'Could not load the menu.')
      })
      .catch(() => !cancelled && setError('Network problem — could not load the menu. Check your connection and try again.'))
    return () => {
      cancelled = true
    }
  }, [])

  const q = query.trim().toLowerCase()

  const visibleCategories = useMemo(() => {
    if (!categories) return []
    let cats = categories
    if (activeCat !== 'all') cats = cats.filter((c) => c.slug === activeCat)
    if (!q) return cats
    return cats
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description ?? '').toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.items.length > 0)
  }, [categories, activeCat, q])

  const totalResults = visibleCategories.reduce((a, c) => a + c.items.length, 0)

  function openItem(item: ApiMenuItem) {
    if (item.pricePending) return
    setModalItem(item)
    setModalOpen(true)
  }

  // Every dish deserves a photo — fall back to the category's image
  function withImage(item: ApiMenuItem, cat: ApiCategory): ApiMenuItem {
    return item.imageUrl ? item : { ...item, imageUrl: cat.image }
  }

  function quickAdd(item: ApiMenuItem) {
    // No customization groups → add straight to cart with default variant
    if (item.modifierGroups.length === 0 && !item.pricePending) {
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
      return
    }
    openItem(item)
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      {/* Title + search */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Our <span className="text-[#C20E0E]">Menu</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Fresh Italian classics — every price shown is the restaurant&apos;s official price.
        </p>
      </div>

      <div className="mx-auto mt-5 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the menu — try “pizza”, “chicken parm”, “cannoli”…"
            className="h-11 rounded-full pl-9"
            aria-label="Search menu"
          />
        </div>
      </div>

      {/* Category chips */}
      <div ref={catNavRef} className="hide-scrollbar sticky top-[65px] z-30 -mx-3 mt-4 flex gap-2 overflow-x-auto bg-background/95 px-3 py-2.5 backdrop-blur sm:-mx-4 sm:px-4" role="tablist" aria-label="Menu categories">
        <button
          role="tab"
          aria-selected={activeCat === 'all'}
          onClick={() => setActiveCat('all')}
          className={`category-chip rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            activeCat === 'all' ? 'border-[#C20E0E] bg-[#C20E0E] text-white' : 'border-border bg-white text-foreground/75 hover:border-[#C20E0E]/40'
          }`}
        >
          All
        </button>
        {(categories ?? []).map((c) => (
          <button
            key={c.slug}
            role="tab"
            aria-selected={activeCat === c.slug}
            onClick={() => setActiveCat(c.slug)}
            className={`category-chip rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeCat === c.slug ? 'border-[#C20E0E] bg-[#C20E0E] text-white' : 'border-border bg-white text-foreground/75 hover:border-[#C20E0E]/40'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Loading / error / empty states */}
      {!categories && !error && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-4">
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="mt-3 h-5 w-2/3" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-auto mt-8 max-w-md rounded-xl border border-amber-300 bg-amber-50 p-5 text-center" role="alert">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" aria-hidden />
          <p className="mt-2 font-semibold text-amber-900">{error}</p>
          <Button className="btn-brand mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {categories && totalResults === 0 && (
        <div className="mx-auto mt-10 max-w-md text-center">
          <p className="text-lg font-semibold">No menu items match “{query}”.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search term, or browse a category above.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQuery('')
              setActiveCat('all')
            }}
          >
            Show everything
          </Button>
        </div>
      )}

      {/* Menu sections */}
      {visibleCategories.map((cat) => (
        <section key={cat.id} id={`cat-${cat.slug}`} className="mt-8 scroll-mt-28" aria-label={cat.name}>
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-[#C20E0E]/15 pb-2">
            <div>
              <h2 className="text-2xl font-extrabold text-[#C20E0E]">
                {cat.italianName ?? cat.name}{' '}
                {cat.italianName && <span className="text-lg font-bold text-[#3D8B37] italic">{cat.name}</span>}
              </h2>
              {cat.description && <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground sm:text-sm">{cat.description}</p>}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.items.map((rawItem) => {
              const item = withImage(rawItem, cat)
              return (
              <article
                key={item.id}
                className={`menu-item-card flex flex-col overflow-hidden rounded-xl border border-border bg-white ${item.available && !item.pricePending ? '' : 'opacity-70'}`}
              >
                {item.imageUrl ? (
                  <div className="relative h-36 w-full bg-secondary">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                    {item.popular && <Badge className="absolute left-2 top-2 bg-[#C20E0E] hover:bg-[#C20E0E]">Popular</Badge>}
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{item.name}</h3>
                    <span className="shrink-0 font-bold text-[#C20E0E]">
                      {item.pricePending ? (
                        <span className="text-xs font-medium text-amber-700">Price pending</span>
                      ) : item.variants.length > 0 ? (
                        <span className="text-sm">
                          {fmt(item.variants.find((v) => v.isDefault)?.price ?? item.variants[0].price)}
                          {item.variants.length > 1 && <span className="text-muted-foreground">+</span>}
                        </span>
                      ) : (
                        fmt(item.basePrice ?? 0)
                      )}
                    </span>
                  </div>
                  {item.description && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>}

                  {item.variants.length > 0 && !item.pricePending && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.variants.map((v) => `${v.name} ${fmt(v.price)}`).join(' · ')}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    {item.isAlcohol && <span className="text-[11px] font-medium text-muted-foreground">21+ ID required</span>}
                    <div className="ml-auto">
                      {!item.available ? (
                        <span className="text-sm font-medium text-muted-foreground">Currently unavailable</span>
                      ) : item.pricePending ? (
                        <span className="text-xs font-medium text-amber-700">Awaiting price from restaurant</span>
                      ) : item.modifierGroups.length === 0 && item.variants.length <= 1 ? (
                        <Button size="sm" className="btn-brand h-9 px-4" onClick={() => quickAdd(item)} aria-label={`Add ${item.name} to cart`}>
                          <Plus className="mr-1 h-4 w-4" aria-hidden /> Add
                        </Button>
                      ) : (
                        <Button size="sm" className="btn-brand h-9 px-4" onClick={() => openItem(item)} aria-label={`Customize ${item.name}`}>
                          Customize
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
              )
            })}
          </div>
        </section>
      ))}

      <ItemModal item={modalItem} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}

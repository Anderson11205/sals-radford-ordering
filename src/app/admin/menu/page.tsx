'use client'

// Menu management — availability toggles, price edits (flagged pending), variant prices
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Search, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { fmt } from '@/lib/menu-types'

interface AdminItem {
  id: string
  name: string
  description: string | null
  category: string
  basePrice: number | null
  pricePending: boolean
  available: boolean
  popular: boolean
  isAlcohol: boolean
  variants: { id: string; name: string; price: number }[]
}

export default function AdminMenuPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<AdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<AdminItem | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editVariants, setEditVariants] = useState<{ id: string; name: string; price: string }[]>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/menu?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
    const d = await res.json()
    if (d.ok) setItems(d.items)
    setLoading(false)
  }, [q])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  async function toggleAvailable(item: AdminItem, available: boolean) {
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available }),
    })
    const d = await res.json()
    if (d.ok) {
      toast({ title: available ? `${item.name} is back on the menu` : `${item.name} hidden from customers` })
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, available } : i)))
    } else {
      toast({ title: 'Could not update', description: d.error, variant: 'destructive' })
    }
  }

  function openEdit(item: AdminItem) {
    setEditing(item)
    setEditPrice(item.basePrice != null ? String(item.basePrice) : '')
    setEditDesc(item.description ?? '')
    setEditVariants(item.variants.map((v) => ({ id: v.id, name: v.name, price: String(v.price) })))
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    const body: Record<string, unknown> = { description: editDesc }
    if (editVariants.length === 0) body.price = editPrice === '' ? null : parseFloat(editPrice)
    else body.variants = editVariants.map((v) => ({ id: v.id, price: parseFloat(v.price) }))
    const res = await fetch(`/api/admin/menu/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await res.json()
    setSaving(false)
    if (d.ok) {
      toast({ title: 'Saved', description: 'Price changes apply to new orders only — past orders keep their original prices.' })
      setEditing(null)
      load()
    } else {
      toast({ title: 'Could not save', description: d.error, variant: 'destructive' })
    }
  }

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search menu items…" className="pl-9" aria-label="Search menu items" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#C20E0E]" aria-label="Loading menu" />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 font-semibold">Item</th>
                <th className="px-3 py-2.5 font-semibold">Category</th>
                <th className="px-3 py-2.5 font-semibold">Price</th>
                <th className="px-3 py-2.5 font-semibold">Available</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-secondary/40">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{i.name}</p>
                    {i.isAlcohol && <Badge variant="outline" className="mt-0.5 text-[10px]">21+</Badge>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{i.category}</td>
                  <td className="px-3 py-2.5">
                    {i.pricePending ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Price pending</Badge>
                    ) : i.variants.length > 0 ? (
                      <span className="text-xs">
                        {i.variants.map((v) => `${v.name} ${fmt(v.price)}`).join(' · ')}
                      </span>
                    ) : (
                      <span className="font-semibold">{fmt(i.basePrice ?? 0)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Switch checked={i.available} onCheckedChange={(v) => toggleAvailable(i, v)} aria-label={`Toggle availability for ${i.name}`} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => openEdit(i)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-md">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Edit — {editing.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {editVariants.length === 0 ? (
                  <div>
                    <Label htmlFor="ed-price">Price (USD) — leave empty to mark “price pending”</Label>
                    <Input id="ed-price" type="number" step="0.01" min="0" max="500" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="mt-1" />
                  </div>
                ) : (
                  editVariants.map((v, idx) => (
                    <div key={v.id}>
                      <Label htmlFor={`ed-v-${v.id}`}>{v.name} price (USD)</Label>
                      <Input
                        id={`ed-v-${v.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="500"
                        value={v.price}
                        onChange={(e) => setEditVariants((list) => list.map((x, i) => (i === idx ? { ...x, price: e.target.value } : x)))}
                        className="mt-1"
                      />
                    </div>
                  ))
                )}
                <div>
                  <Label htmlFor="ed-desc">Description</Label>
                  <Input id="ed-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="mt-1" />
                </div>
                <p className="text-xs text-muted-foreground">
                  <Power className="mr-1 inline h-3 w-3" aria-hidden />
                  Price changes affect new orders only. Historical orders keep their original prices.
                </p>
                <Button className="btn-brand w-full" onClick={saveEdit} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

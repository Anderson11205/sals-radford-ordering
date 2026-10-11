'use client'

// Owner settings — fulfillment, tax, payment configuration with safety interlocks
import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [readOnly, setReadOnly] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/settings', { cache: 'no-store' })
    const d = await res.json()
    if (d.ok) {
      setSettings(d.settings)
      setReadOnly(d.readOnly)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' }).catch(() => null)
      if (!res || cancelled) return
      const d = await res.json()
      if (cancelled) return
      if (d.ok) {
        setSettings(d.settings)
        setReadOnly(d.readOnly)
      }
      setLoading(false)
    }
    run()
  }, [])

  function set(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  async function save() {
    setSaving(true)
    const payload: Record<string, string> = {}
    const keys = ['pickupEnabled', 'deliveryEnabled', 'deliveryFee', 'deliveryMinimum', 'taxRatePercent', 'taxRateConfirmed', 'bankTransferEnabled', 'bankName', 'bankAccountName', 'bankAccountNumber', 'bankDetailsVerified', 'inviteExpiryHours']
    for (const k of keys) if (k in settings) payload[k] = String(settings[k])
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: payload }),
    })
    const d = await res.json()
    setSaving(false)
    if (d.ok) {
      setSettings(d.settings)
      toast({ title: 'Settings saved' })
    } else {
      toast({ title: 'Could not save', description: d.error, variant: 'destructive' })
      load()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#C20E0E]" aria-label="Loading settings" />
      </div>
    )
  }

  const bool = (k: string) => settings[k] === 'true'
  const setBool = (k: string, v: boolean) => set(k, v ? 'true' : 'false')

  return (
    <div className="space-y-6">
      {readOnly && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="note">
          <AlertTriangle className="mr-1.5 inline h-4 w-4" aria-hidden />
          Managers see settings read-only. Only the primary owner can make changes.
        </div>
      )}

      <fieldset disabled={readOnly} className="space-y-6">
        {/* Fulfillment */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-bold">Fulfillment</h2>
          <div className="mt-3 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Pickup orders</p>
                <p className="text-xs text-muted-foreground">Customers collect at 709 West Main Street, Radford.</p>
              </div>
              <Switch checked={bool('pickupEnabled')} onCheckedChange={(v) => setBool('pickupEnabled', v)} aria-label="Toggle pickup" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Delivery orders</p>
                <p className="text-xs text-muted-foreground">Only enable after confirming delivery coverage with the restaurant.</p>
              </div>
              <Switch checked={bool('deliveryEnabled')} onCheckedChange={(v) => setBool('deliveryEnabled', v)} aria-label="Toggle delivery" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="st-fee">Delivery fee (USD)</Label>
                <Input id="st-fee" type="number" step="0.01" min="0" value={settings.deliveryFee ?? '0'} onChange={(e) => set('deliveryFee', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="st-min">Minimum order for delivery (USD, 0 = none)</Label>
                <Input id="st-min" type="number" step="0.01" min="0" value={settings.deliveryMinimum ?? '0'} onChange={(e) => set('deliveryMinimum', e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
        </section>

        {/* Tax */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-bold">Tax</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="st-tax">Meals tax rate (%)</Label>
              <Input id="st-tax" type="number" step="0.01" min="0" max="30" value={settings.taxRatePercent ?? '0'} onChange={(e) => set('taxRatePercent', e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={bool('taxRateConfirmed')} onCheckedChange={(v) => setBool('taxRateConfirmed', v)} id="st-taxconf" aria-label="Confirm tax rate" />
              <Label htmlFor="st-taxconf" className="text-sm">
                I confirm this rate with the restaurant
              </Label>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The tax rate starts at 0% (customers pay menu prices) until the correct Radford meals tax rate is entered and confirmed. Nothing is invented automatically.
          </p>
        </section>

        {/* Payment / bank */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-bold">Bank transfer payment</h2>
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="font-semibold">Proposed details — verification required before customers see them:</p>
            <p className="mt-1">These were provided for verification only. Confirm the bank country, currency, account type and US domestic transfer support before activating.</p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="st-bank">Bank name</Label>
              <Input id="st-bank" value={settings.bankName ?? ''} onChange={(e) => set('bankName', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="st-acctname">Beneficiary name</Label>
              <Input id="st-acctname" value={settings.bankAccountName ?? ''} onChange={(e) => set('bankAccountName', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="st-acct">Account number</Label>
              <Input id="st-acct" value={settings.bankAccountNumber ?? ''} onChange={(e) => set('bankAccountNumber', e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch id="st-verified" checked={bool('bankDetailsVerified')} onCheckedChange={(v) => setBool('bankDetailsVerified', v)} aria-label="Bank details verified" />
              <Label htmlFor="st-verified" className="text-sm">
                I have verified these details with the bank
              </Label>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-secondary p-3">
            <div>
              <p className="text-sm font-semibold">Accept bank-transfer orders</p>
              <p className="text-xs text-muted-foreground">Customers submit a payment reference; staff verify before confirming. Requires verified bank details.</p>
            </div>
            <Switch checked={bool('bankTransferEnabled')} onCheckedChange={(v) => setBool('bankTransferEnabled', v)} aria-label="Toggle bank transfer" />
          </div>
        </section>

        {/* Invitations */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-bold">Manager invitations</h2>
          <div className="mt-3">
            <Label htmlFor="st-inv">Invitation link expiry (hours)</Label>
            <Input id="st-inv" type="number" min="1" max="168" value={settings.inviteExpiryHours ?? '72'} onChange={(e) => set('inviteExpiryHours', e.target.value)} className="mt-1 sm:w-56" />
          </div>
        </section>

        <Button className="btn-brand h-11 w-full sm:w-auto sm:px-8" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save all settings'}
        </Button>
      </fieldset>
    </div>
  )
}

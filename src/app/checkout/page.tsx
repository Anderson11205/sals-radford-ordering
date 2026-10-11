'use client'

// Checkout — guest or logged-in, pickup/delivery, allergy notice, payment method.
// Server recomputes every price; client totals are display-only.
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, ShieldCheck, Banknote, Landmark, Copy, Check, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { useCart, cartSubtotal, cartCount, toCartInput } from '@/lib/cart-store'
import { fmt } from '@/lib/menu-types'

interface MeResponse {
  user: { userId: string; name: string; email: string; role: string } | null
}

const subscribeNoop = () => () => {}

/** One copyable bank-detail row (account name, number…) for the transfer card. */
function BankDetailRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — value is still fully visible
    }
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm font-semibold">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-secondary"
      >
        {copied ? <Check className="h-4 w-4 text-[#3D8B37]" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { lines, clear } = useCart()

  // Hydration-safe mount detection
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [user, setUser] = useState<MeResponse['user']>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [paymentMethods, setPaymentMethods] = useState<{ value: string; label: string; description: string }[]>([])

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [fulfillment, setFulfillment] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [address, setAddress] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [allergyNotes, setAllergyNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PAY_ON_SITE')

  useEffect(() => {
    let cancelled = false
    async function run() {
      const meRes = await fetch('/api/auth/me').then((r) => r.json()).catch(() => null)
      if (cancelled || !meRes) return
      if (meRes.user) {
        setUser(meRes.user)
        setCustomerName((n) => n || meRes.user!.name)
        setEmail((e) => e || meRes.user.email)
      }
    }
    run()
    async function loadSettings() {
      const d = await fetch('/api/settings/public').then((r) => r.json()).catch(() => null)
      if (cancelled || !d?.ok) return
      setSettings(d.settings)
      const methods = [{ value: 'PAY_ON_SITE', label: 'Pay at pickup / delivery', description: 'Pay in person — cash or card. Simplest and fastest.' }]
      if (d.settings.bankTransferEnabled === 'true') {
        methods.push({
          value: 'BANK_TRANSFER',
          label: 'Bank transfer (needs verification)',
          description: `Transfer to ${d.settings.bankName ?? 'our account'} — the account details appear here when selected. After paying, tap “I have paid” on your order page and the restaurant verifies it.`,
        })
      }
      setPaymentMethods(methods)
    }
    loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  const deliveryEnabled = settings.deliveryEnabled === 'true'
  // Effective fulfillment: never allow DELIVERY unless the restaurant enabled it
  const effectiveFulfillment = deliveryEnabled ? fulfillment : 'PICKUP'

  const subtotal = cartSubtotal(lines)
  const count = cartCount(lines)
  const taxRate = parseFloat(settings.taxRatePercent ?? '0') / 100
  const taxAmount = useMemo(() => Math.round(subtotal * taxRate * 100) / 100, [subtotal, taxRate])
  const deliveryFee = effectiveFulfillment === 'DELIVERY' ? parseFloat(settings.deliveryFee ?? '0') || 0 : 0
  const total = Math.round((subtotal + taxAmount + deliveryFee) * 100) / 100

  async function submit() {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          lines: toCartInput(lines),
          customerName,
          phone,
          email: email || undefined,
          fulfillment: effectiveFulfillment,
          address: effectiveFulfillment === 'DELIVERY' ? address : undefined,
          orderNotes: orderNotes || undefined,
          allergyNotes: allergyNotes || undefined,
          paymentMethod,
        }),
      })
      const d = await res.json()
      if (!d.ok) {
        setError(d.error ?? 'Could not place your order. Please try again.')
        setSubmitting(false)
        return
      }
      clear()
      router.push(`/order-confirmed/${d.orderNumber}?t=${d.accessToken}`)
    } catch {
      setError('Network problem — your order was NOT placed. Check your connection and try again. You will not be double-charged.')
      setSubmitting(false)
    }
  }

  if (!mounted) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Loading checkout…</div>
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Your cart is empty.</p>
        <Link href="/menu" className="btn-brand mt-4 inline-flex h-11 items-center px-6">
          Browse the menu
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">
        <span className="text-[#C20E0E]">Checkout</span>
      </h1>
      {!user && (
        <p className="mt-1 text-sm text-muted-foreground">
          Checking out as a guest.{' '}
          <Link href="/account/login?next=/checkout" className="font-semibold text-[#C20E0E] hover:underline">
            Sign in
          </Link>{' '}
          to keep your order history in one place — optional.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Form column */}
        <div className="space-y-6">
          {/* Contact */}
          <section className="rounded-xl border border-border bg-white p-4 sm:p-5" aria-labelledby="contact-h">
            <h2 id="contact-h" className="font-bold">
              Your contact details
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="co-name">Full name *</Label>
                <Input id="co-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1" autoComplete="name" required />
              </div>
              <div>
                <Label htmlFor="co-phone">Phone number *</Label>
                <Input id="co-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="(540) 555-0100" autoComplete="tel" required />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="co-email">Email (optional — for your receipt & updates)</Label>
                <Input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" autoComplete="email" />
              </div>
            </div>
          </section>

          {/* Fulfillment */}
          <section className="rounded-xl border border-border bg-white p-4 sm:p-5" aria-labelledby="fulfill-h">
            <h2 id="fulfill-h" className="font-bold">
              How would you like your order?
            </h2>
            <RadioGroup value={effectiveFulfillment} onValueChange={(v) => setFulfillment(v as 'PICKUP' | 'DELIVERY')} className="mt-3 gap-2">
              <Label htmlFor="ful-pickup" className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3.5 has-[[data-state=checked]]:border-[#C20E0E] has-[[data-state=checked]]:bg-red-50/40">
                <RadioGroupItem id="ful-pickup" value="PICKUP" className="mt-0.5" />
                <span>
                  <span className="block font-semibold">Pickup</span>
                  <span className="block text-xs text-muted-foreground">Ready at 709 West Main Street, Radford — pay cash or card on arrival.</span>
                </span>
              </Label>
              <Label
                htmlFor="ful-delivery"
                className={`flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3.5 has-[[data-state=checked]]:border-[#C20E0E] has-[[data-state=checked]]:bg-red-50/40 ${
                  !deliveryEnabled ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <RadioGroupItem id="ful-delivery" value="DELIVERY" className="mt-0.5" />
                <span>
                  <span className="block font-semibold">
                    Delivery {!deliveryEnabled && <span className="text-xs font-medium text-amber-700">— not available yet</span>}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {deliveryEnabled
                      ? `Delivery fee ${fmt(parseFloat(settings.deliveryFee ?? '0'))}${settings.deliveryMinimum && parseFloat(settings.deliveryMinimum) > 0 ? ` · minimum order ${fmt(parseFloat(settings.deliveryMinimum))}` : ''}.`
                      : 'The restaurant has not activated delivery yet. Choose pickup for now.'}
                  </span>
                </span>
              </Label>
            </RadioGroup>
            {effectiveFulfillment === 'DELIVERY' && deliveryEnabled && (
              <div className="mt-3">
                <Label htmlFor="co-address">Delivery address *</Label>
                <Textarea id="co-address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" placeholder="Street address, apartment, city, VA ZIP" required />
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-border bg-white p-4 sm:p-5" aria-labelledby="pay-h">
            <h2 id="pay-h" className="font-bold">
              Payment
            </h2>
            {paymentMethods.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading payment options…</p>
            ) : (
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-3 gap-2">
                {paymentMethods.map((m) => (
                  <Label key={m.value} htmlFor={`pm-${m.value}`} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3.5 has-[[data-state=checked]]:border-[#C20E0E] has-[[data-state=checked]]:bg-red-50/40">
                    <RadioGroupItem id={`pm-${m.value}`} value={m.value} className="mt-0.5" />
                    <span>
                      <span className="flex items-center gap-2 font-semibold">
                        {m.value === 'PAY_ON_SITE' ? <Banknote className="h-4 w-4 text-[#3D8B37]" aria-hidden /> : <Landmark className="h-4 w-4 text-[#C20E0E]" aria-hidden />}
                        {m.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{m.description}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}
            {paymentMethod === 'BANK_TRANSFER' && (settings.bankAccountName || settings.bankAccountNumber) && (
              <div className="mt-3 rounded-xl border-2 border-[#C20E0E]/25 bg-[#fdf8f3] p-4">
                <p className="flex items-center gap-2 font-bold">
                  <Landmark className="h-4 w-4 text-[#C20E0E]" aria-hidden />
                  Transfer to this account
                </p>
                <div className="mt-3 space-y-2">
                  {settings.bankName && <BankDetailRow label="Bank" value={settings.bankName} />}
                  {settings.bankAccountName && <BankDetailRow label="Account name" value={settings.bankAccountName} />}
                  {settings.bankAccountNumber && <BankDetailRow label="Account number" value={settings.bankAccountNumber} />}
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Amount to transfer</p>
                      <p className="font-mono text-sm font-bold text-[#C20E0E]">{fmt(total)}</p>
                    </div>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </div>
                </div>
                <ol className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <li>1. Place the order (button below) — your order page opens.</li>
                  <li>2. Transfer exactly {fmt(total)} to the account above.</li>
                  <li>3. On your order page, tap “I have paid” and enter the transfer reference.</li>
                  <li>4. The restaurant verifies it with the bank, then confirms your payment.</li>
                </ol>
              </div>
            )}
            {paymentMethod === 'BANK_TRANSFER' && !settings.bankAccountName && !settings.bankAccountNumber && (
              <div className="mt-3 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Transfer instructions will appear on your order page right after you place the order.</p>
                <p className="mt-1">After transferring, submit your payment reference from the order tracking page. Your payment will show “Under review” until the restaurant verifies it — a receipt alone is not confirmation.</p>
              </div>
            )}
          </section>

          {/* Notes & allergies */}
          <section className="rounded-xl border border-border bg-white p-4 sm:p-5" aria-labelledby="notes-h">
            <h2 id="notes-h" className="font-bold">
              Order notes &amp; allergies (optional)
            </h2>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="co-notes">Notes for the restaurant</Label>
                <Textarea id="co-notes" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value.slice(0, 500))} className="mt-1" placeholder="e.g. please include extra napkins, buzz apartment 2…" />
              </div>
              <div>
                <Label htmlFor="co-allergy">Allergies or dietary requests</Label>
                <Textarea id="co-allergy" value={allergyNotes} onChange={(e) => setAllergyNotes(e.target.value.slice(0, 500))} className="mt-1" placeholder="e.g. severe peanut allergy" />
              </div>
              <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900" role="alert">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                <p>
                  <strong>Important:</strong> Submitting an allergy note does not guarantee an allergen-free meal. If you
                  have a serious allergy, please call us directly at{' '}
                  <a href="tel:+15406399669" className="font-semibold underline">
                    (540) 639-9669
                  </a>{' '}
                  to discuss ingredients and cross-contact precautions before ordering.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Summary column */}
        <aside className="lg:sticky lg:top-28 h-fit rounded-xl border border-border bg-white p-4 sm:p-5" aria-label="Order summary">
          <h2 className="font-bold">Order summary</h2>
          <ul className="mt-3 max-h-64 space-y-2.5 overflow-y-auto pr-1">
            {lines.map((l) => (
              <li key={l.lineId} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {l.quantity} × {l.name}
                    {l.variantName ? ` (${l.variantName})` : ''}
                  </p>
                  {l.selections.length > 0 && <p className="truncate text-xs text-muted-foreground">{l.selections.map((s) => s.name).join(', ')}</p>}
                </div>
                <span className="shrink-0 font-medium">{fmt(Math.round((l.basePrice + l.selections.reduce((a, s) => a + s.price, 0)) * l.quantity * 100) / 100)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({settings.taxRatePercent}%)</span>
                <span>{fmt(taxAmount)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery fee</span>
                <span>{fmt(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
            {taxAmount === 0 && (
              <p className="text-[11px] leading-snug text-muted-foreground">
                Tax is not yet configured by the restaurant — you pay the menu prices shown. The restaurant may adjust
                tax handling before your pickup.
              </p>
            )}
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800" role="alert">
              {error}
            </div>
          )}

          <Button className="btn-brand mt-4 h-12 w-full text-base" onClick={submit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Placing order…
              </>
            ) : (
              <>Place order · {fmt(total)}</>
            )}
          </Button>
          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#3D8B37]" aria-hidden />
            Your order is saved securely. Double-taps and retries are protected — you will never be charged twice for the
            same order.
          </p>
        </aside>
      </div>
    </div>
  )
}

'use client'

// Confirmation hero — shows the order number big, lets guests copy/save their tracking link,
// and explains exactly how to check the order status later.
import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, MapPin } from 'lucide-react'

export function ConfirmationHero({ orderNumber, accessToken }: { orderNumber: string; accessToken?: string }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard unavailable (older browsers) — the number is big on screen anyway
    }
  }

  return (
    <div className="sals-cream border-b border-border py-6 text-center">
      <div className="mx-auto max-w-2xl px-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#3D8B37]">Order placed successfully</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          Thank you for ordering from <span className="text-[#C20E0E]">Sal&apos;s!</span>
        </h1>

        <div className="mx-auto mt-4 max-w-sm rounded-2xl border-2 border-dashed border-[#C20E0E]/40 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your order number</p>
          <p className="mt-1 font-mono text-3xl font-extrabold tracking-wider text-[#C20E0E]">{orderNumber}</p>
          <button
            onClick={copyLink}
            className="mx-auto mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-secondary"
          >
            {copied ? <Check className="h-4 w-4 text-[#3D8B37]" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? 'Link copied!' : 'Save this page (copy link)'}
          </button>
        </div>

        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          <strong className="text-foreground">Keep your order number</strong> — you can check the status any time on
          this page (it updates live), or later via{' '}
          <Link href="/track" className="font-semibold text-[#C20E0E] hover:underline">
            Track Order
          </Link>{' '}
          using this number and the phone number you entered. No account needed.
        </p>
        <p className="mx-auto mt-1.5 flex max-w-md items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden /> Bookmark or screenshot this page so you can come back in one tap.
        </p>
      </div>
    </div>
  )
}

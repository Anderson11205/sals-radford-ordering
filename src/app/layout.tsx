import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: {
    default: "Sal's Italian Restaurant & Pizzeria — Order Online",
    template: "%s — Sal's Italian Restaurant & Pizzeria",
  },
  description:
    'Order authentic Italian food online from Sal\'s Italian Restaurant & Pizzeria in Radford, Virginia. Pizza, pasta, calzones, subs and more — pickup or delivery. Since 1978.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#C20E0E',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`} style={{ fontFamily: 'var(--font-poppins), Poppins, system-ui, sans-serif' }}>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  )
}

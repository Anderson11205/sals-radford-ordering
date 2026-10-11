import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = 'sals_session'

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || 'sals-dev-secret-change-me-in-production-0123456789'
  return new TextEncoder().encode(secret)
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Admin: require OWNER/MANAGER session (API routes re-verify against the DB)
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) {
      return NextResponse.redirect(new URL('/account/login?next=' + encodeURIComponent(pathname), req.url))
    }
    try {
      const { payload } = await jwtVerify(token, secretKey())
      if (payload.role !== 'OWNER' && payload.role !== 'MANAGER') {
        return NextResponse.redirect(new URL('/account?denied=admin', req.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/account/login?next=' + encodeURIComponent(pathname), req.url))
    }
  }

  const res = NextResponse.next()
  // Basic security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return res
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*', '/track/:path*', '/menu/:path*', '/cart/:path*', '/'],
}

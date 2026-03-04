import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes
  if (pathname.startsWith('/login')) {
    if (isLoggedIn) {
      const role = req.auth?.user?.role
      return NextResponse.redirect(new URL(role === 'ADMIN' ? '/dashboard' : '/pos', req.url))
    }
    return NextResponse.next()
  }

  // Protected routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Admin-only routes
  const adminRoutes = ['/dashboard', '/products', '/categories', '/inventory', '/reports', '/users']
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r))
  if (isAdminRoute && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/pos', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true'
  const isAuthPage = request.nextUrl.pathname === '/login'

  // 1. If not logged in and not on login page -> Redirect to login
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. If already logged in and trying to go to login -> Redirect to dashboard
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
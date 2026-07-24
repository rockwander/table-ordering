import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If accessing root from Capacitor WebView, redirect to admin dashboard
  if (request.nextUrl.pathname === '/') {
    const userAgent = request.headers.get('user-agent') || '';

    // Check if request is from Capacitor WebView
    if (userAgent.includes('CapacitorWebView')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};

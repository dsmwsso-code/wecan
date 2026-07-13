import { NextResponse } from 'next/server';
import { verifySessionToken } from './lib/auth';

// Paths that don't require authentication
const publicPaths = ['/', '/login', '/api/auth/login'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/assets')) {
    return NextResponse.next();
  }

  // Check for session token
  const token = request.cookies.get('session_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify the token
  const payload = await verifySessionToken(token);

  if (!payload) {
    // Invalid or expired token, clear cookie and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session_token');
    return response;
  }

  // Role-Based Access Control (RBAC)
  const isSuperAdminPath = pathname.startsWith('/super-admin');
  const isAdminPath = pathname.startsWith('/admin');

  if (isSuperAdminPath && payload.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (isAdminPath && !['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Append user payload to headers for downstream access (if needed)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.id.toString());
  requestHeaders.set('x-user-role', payload.role);
  if (payload.gnDivisionId) {
    requestHeaders.set('x-user-gn-division-id', payload.gnDivisionId.toString());
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { canAccessPage, homeForRole } from '@/lib/auth-policy';

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/leads/:path*',
    '/funil',
    '/admin',
    '/admin/:path*',
    '/imoveis/:path*',
  ],
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await getAuthFromRequest(request);
    if (!payload) throw new Error('Sessão indisponível.');

    if (!canAccessPage(payload.role, request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL(homeForRole(payload.role), request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

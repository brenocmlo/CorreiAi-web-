import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { canAccessPage } from '@/lib/auth-policy';

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/leads/:path*',
    '/funil',
    '/admin',
    '/admin/:path*',
    '/imoveis/novo',
    '/imoveis/:id/editar',
  ],
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = verifyToken(token);

    if (!canAccessPage(payload.role, request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

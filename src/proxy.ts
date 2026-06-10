import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/leads/:path*',
    '/funil',
    '/admin',
    '/admin/:path*',
    '/imoveis',
    '/imoveis/:path*',
  ],
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = verifyToken(token);

    if (
      request.nextUrl.pathname.startsWith('/admin') &&
      payload.role !== 'admin_corretora' &&
      payload.role !== 'super_admin'
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

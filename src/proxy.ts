import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// Rotas que exigem autenticação
export const config = {
  matcher: ['/', '/dashboard/:path*', '/leads/:path*', '/funil'],
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    verifyToken(token);
    return NextResponse.next();
  } catch {
    // Token inválido ou expirado — limpar cookie e redirecionar
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

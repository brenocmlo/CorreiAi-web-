import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/api-auth';
import { canAccessPage, homeForRole, isPrivatePage } from '@/lib/auth-policy';
import { isSameOriginRequest, requestOrigin } from '@/lib/request-origin';

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard',
    '/cliente/:path*',
    '/dashboard/:path*',
    '/leads/:path*',
    '/funil',
    '/admin',
    '/admin/:path*',
    '/imoveis/:path*',
  ],
};

function noCache(response: NextResponse) {
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !isSameOriginRequest(request)) {
      return noCache(NextResponse.json({ error: 'Origem inválida.' }, { status: 403 }));
    }
    // Cada handler verifica a sessão e o proprietário; APIs não redirecionam para HTML.
    return noCache(NextResponse.next());
  }
  if (!isPrivatePage(request.nextUrl.pathname)) return NextResponse.next();
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return noCache(NextResponse.redirect(new URL('/login', requestOrigin(request))));
  }

  try {
    const payload = await getAuthFromRequest(request);
    if (!payload) throw new Error('Sessão indisponível.');

    if (!canAccessPage(payload.role, request.nextUrl.pathname)) {
      return noCache(NextResponse.redirect(new URL(homeForRole(payload.role), requestOrigin(request))));
    }

    return noCache(NextResponse.next());
  } catch {
    const response = NextResponse.redirect(new URL('/login', requestOrigin(request)));
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return noCache(response);
  }
}

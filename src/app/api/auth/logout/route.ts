import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest, requestOrigin } from '@/lib/request-origin';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const response = NextResponse.redirect(new URL('/login', requestOrigin(request)), 303);
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set('correia_atendimento', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}

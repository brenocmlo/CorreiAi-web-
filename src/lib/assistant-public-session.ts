import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ASSISTANT_COOKIE } from './assistant-store';
export const publicSessionHash = (cookieHash: string, companyId: string) =>
  createHash('sha256')
    .update(`public:${companyId}:${cookieHash}`)
    .digest('hex');
export function withAssistantSession(response: NextResponse, token: string) {
  response.headers.set('Cache-Control', 'private, no-store');
  response.cookies.set(ASSISTANT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

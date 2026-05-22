import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export function getAuthFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

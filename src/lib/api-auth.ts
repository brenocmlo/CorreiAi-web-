import { NextRequest, NextResponse } from 'next/server.js';
import { verifyToken } from './jwt.ts';

export function getAuthFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

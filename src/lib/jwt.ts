import jwt from 'jsonwebtoken';
import { isAppRole, type AppRole } from './auth-policy';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '8h';

export interface JwtPayload {
  uid: string;
  email: string;
  role: AppRole;
  nome_completo: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  const payload = jwt.verify(token, JWT_SECRET);
  if (typeof payload === 'string' || typeof payload.uid !== 'string' || !isAppRole(payload.role)) {
    throw new Error('Token inválido.');
  }
  return payload as JwtPayload;
}

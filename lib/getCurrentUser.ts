import { NextRequest } from 'next/server';
import { verifyToken, UserTokenPayload } from './auth';

export function getCurrentUser(req: NextRequest): UserTokenPayload | null {
  const token = req.cookies.get('nekoapi_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

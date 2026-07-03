import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'nekoapi-super-secret-key-change-me-in-production';

export interface UserTokenPayload {
  id: string;
  username: string;
  role: string;
}

export function hashPin(pin: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(pin, salt);
}

export function comparePin(pin: string, hash: string): boolean {
  return bcrypt.compareSync(pin, hash);
}

export function signToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserTokenPayload;
  } catch {
    return null;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('nekoapi_token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: decoded });
}

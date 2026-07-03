import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePin, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, pin } = await req.json();

    if (!username || !pin) {
      return NextResponse.json({ error: 'Username and PIN are required' }, { status: 400 });
    }

    const pinRegex = /^\d{6,8}$/;
    if (!pinRegex.test(pin)) {
      return NextResponse.json({ error: 'PIN must be a 6 to 8-digit number' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (!user || !comparePin(pin, user.pinHash)) {
      return NextResponse.json({ error: 'Invalid username or PIN' }, { status: 401 });
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

    response.cookies.set('nekoapi_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Login failed', details: errMessage }, { status: 500 });
  }
}

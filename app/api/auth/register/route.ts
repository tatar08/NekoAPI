import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPin, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, pin } = await req.json();

    if (!username || !email || !pin) {
      return NextResponse.json({ error: 'Username, email, and PIN are required' }, { status: 400 });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username.trim())) {
      return NextResponse.json({ error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    const pinRegex = /^\d{6,8}$/;
    if (!pinRegex.test(pin)) {
      return NextResponse.json({ error: 'PIN must be a 6 to 8-digit number' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: email.trim().toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === username.trim().toLowerCase()) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // First user registered becomes admin
    const totalUsers = await prisma.user.count();
    const role = totalUsers === 0 ? 'admin' : 'user';

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        pinHash: hashPin(pin),
        role,
      },
    });

    const token = signToken({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    });

    const response = NextResponse.json({
      message: 'Registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
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
    return NextResponse.json({ error: 'Registration failed', details: errMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function GET(req: NextRequest) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dbEnvironments = await prisma.environment.findMany({
      where: { userId: user.id },
    });

    const environments = dbEnvironments.map((env: { id: string; name: string; variables: string; userId: string }) => ({
      ...env,
      variables: JSON.parse(env.variables || '[]'),
    }));

    return NextResponse.json({ environments });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch environments', details: errMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Environment name is required' }, { status: 400 });
    }

    const newEnv = await prisma.environment.create({
      data: {
        name: name.trim(),
        variables: JSON.stringify([]),
        userId: user.id,
      },
    });

    return NextResponse.json({
      environment: {
        ...newEnv,
        variables: [],
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create environment', details: errMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify environment ownership
    const env = await prisma.environment.findFirst({
      where: { id, userId: user.id },
    });

    if (!env) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
    }

    const updates = await req.json();

    const data: Record<string, string> = {};
    if ('name' in updates) data.name = updates.name.trim();
    if ('variables' in updates) data.variables = JSON.stringify(updates.variables);

    const updated = await prisma.environment.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      environment: {
        ...updated,
        variables: JSON.parse(updated.variables),
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to update environment', details: errMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify environment ownership
    const env = await prisma.environment.findFirst({
      where: { id, userId: user.id },
    });

    if (!env) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
    }

    await prisma.environment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Environment deleted successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to delete environment', details: errMessage }, { status: 500 });
  }
}

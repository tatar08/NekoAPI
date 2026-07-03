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
    const updates = await req.json();
    
    // Verify ownership or Admin role
    const collection = await prisma.collection.findFirst({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Only the owner or an admin can modify this collection.' }, { status: 403 });
    }

    const data: Record<string, any> = {};
    if ('name' in updates) {
      if (!updates.name || !updates.name.trim()) {
        return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
      }
      data.name = updates.name.trim();
    }
    if ('isShared' in updates) {
      data.isShared = Boolean(updates.isShared);
    }

    const updated = await prisma.collection.update({
      where: { id },
      data,
    });

    return NextResponse.json({ collection: updated });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to update collection', details: errMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership or Admin role
    const collection = await prisma.collection.findFirst({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Only the owner or an admin can delete this collection.' }, { status: 403 });
    }

    await prisma.collection.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Collection deleted successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to delete collection', details: errMessage }, { status: 500 });
  }
}

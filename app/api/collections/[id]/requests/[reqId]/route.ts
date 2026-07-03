import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: collectionId, reqId } = await params;

  try {
    // Verify collection ownership
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: user.id },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const dbRequest = await prisma.request.findFirst({
      where: { id: reqId, collectionId },
    });

    if (!dbRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const updates = await req.json();

    const data: Record<string, string> = {};
    if ('name' in updates) data.name = updates.name;
    if ('method' in updates) data.method = updates.method;
    if ('url' in updates) data.url = updates.url;
    if ('bodyType' in updates) data.bodyType = updates.bodyType;
    if ('body' in updates) data.body = updates.body;
    if ('headers' in updates) data.headers = JSON.stringify(updates.headers);
    if ('params' in updates) data.params = JSON.stringify(updates.params);
    if ('auth' in updates) data.auth = JSON.stringify(updates.auth);

    const updated = await prisma.request.update({
      where: { id: reqId },
      data,
    });

    return NextResponse.json({
      request: {
        ...updated,
        headers: JSON.parse(updated.headers),
        params: JSON.parse(updated.params),
        auth: JSON.parse(updated.auth),
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to update request', details: errMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: collectionId, reqId } = await params;

  try {
    // Verify collection ownership
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: user.id },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const dbRequest = await prisma.request.findFirst({
      where: { id: reqId, collectionId },
    });

    if (!dbRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    await prisma.request.delete({
      where: { id: reqId },
    });

    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to delete request', details: errMessage }, { status: 500 });
  }
}

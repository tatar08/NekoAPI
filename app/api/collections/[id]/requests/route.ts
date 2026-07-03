import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: collectionId } = await params;

  try {
    // Verify collection ownership
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: user.id },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const requestBody = await req.json();
    const { name, method, url, headers, params: qParams, bodyType, body, auth } = requestBody;

    const newRequest = await prisma.request.create({
      data: {
        name: name || 'Untitled Request',
        method: method || 'GET',
        url: url || '',
        headers: JSON.stringify(headers || []),
        params: JSON.stringify(qParams || []),
        bodyType: bodyType || 'none',
        body: body || '',
        auth: JSON.stringify(auth || { type: 'none' }),
        collectionId,
      },
    });

    return NextResponse.json({
      request: {
        ...newRequest,
        headers: JSON.parse(newRequest.headers),
        params: JSON.parse(newRequest.params),
        auth: JSON.parse(newRequest.auth),
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create request', details: errMessage }, { status: 500 });
  }
}

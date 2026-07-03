import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function GET(req: NextRequest) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dbCollections = await prisma.collection.findMany({
      where: {
        OR: [
          { userId: user.id },
          { isShared: true },
        ],
      },
      include: { requests: true },
    });

    // Parse JSON string fields back to objects
    const collections = dbCollections.map((col: { id: string; name: string; isShared: boolean; userId: string; requests: { id: string; name: string; method: string; url: string; headers: string; params: string; bodyType: string; body: string; auth: string }[] }) => ({
      ...col,
      requests: col.requests.map((r: { id: string; name: string; method: string; url: string; headers: string; params: string; bodyType: string; body: string; auth: string }) => ({
        ...r,
        headers: JSON.parse(r.headers || '[]'),
        params: JSON.parse(r.params || '[]'),
        auth: JSON.parse(r.auth || '{"type":"none"}'),
      })),
    }));

    return NextResponse.json({ collections });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch collections', details: errMessage }, { status: 500 });
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
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const newCollection = await prisma.collection.create({
      data: {
        name: name.trim(),
        userId: user.id,
      },
    });

    return NextResponse.json({
      collection: {
        ...newCollection,
        requests: [],
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create collection', details: errMessage }, { status: 500 });
  }
}

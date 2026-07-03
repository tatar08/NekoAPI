import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function GET(req: NextRequest) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      totalCollections,
      totalRequests,
      totalEnvironments,
      totalUsers,
      recentCollections,
    ] = await Promise.all([
      prisma.collection.count({ where: { userId: user.id } }),
      prisma.request.count({
        where: { collection: { userId: user.id } },
      }),
      prisma.environment.count({ where: { userId: user.id } }),
      user.role === 'admin' ? prisma.user.count() : Promise.resolve(0),
      prisma.collection.findMany({
        where: { userId: user.id },
        include: { requests: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate method distribution
    const allRequests = await prisma.request.findMany({
      where: { collection: { userId: user.id } },
      select: { method: true },
    });

    const methodCounts: Record<string, number> = {};
    allRequests.forEach((r: { method: string }) => {
      methodCounts[r.method] = (methodCounts[r.method] || 0) + 1;
    });

    return NextResponse.json({
      stats: {
        totalCollections,
        totalRequests,
        totalEnvironments,
        totalUsers,
      },
      methodDistribution: methodCounts,
      recentCollections: recentCollections.map((c: { id: string; name: string; createdAt: Date; requests: { id: string }[] }) => ({
        id: c.id,
        name: c.name,
        requestCount: c.requests.length,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch stats', details: errMessage }, { status: 500 });
  }
}

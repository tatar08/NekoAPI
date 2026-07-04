import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function GET(req: NextRequest) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        inviteeId: user.id,
        status: 'pending'
      },
      include: {
        team: {
          select: { id: true, name: true }
        },
        invitedBy: {
          select: { id: true, username: true }
        }
      }
    });

    return NextResponse.json({ invitations });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch invitations', details: errMsg }, { status: 500 });
  }
}

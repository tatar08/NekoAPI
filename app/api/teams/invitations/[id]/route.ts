import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: invitationId } = await params;

  try {
    const { action } = await req.json();
    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "accept" or "decline"' }, { status: 400 });
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify invitation is for this user
    if (invitation.inviteeId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation has already been processed' }, { status: 400 });
    }

    if (action === 'accept') {
      // Begin transaction to ensure consistency
      await prisma.$transaction([
        prisma.teamInvitation.update({
          where: { id: invitationId },
          data: { status: 'accepted' }
        }),
        prisma.teamMember.create({
          data: {
            teamId: invitation.teamId,
            userId: user.id,
            role: 'member'
          }
        })
      ]);
    } else {
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'declined' }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to process invitation', details: errMsg }, { status: 500 });
  }
}

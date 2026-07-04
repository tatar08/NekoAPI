import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamId = params.id;

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Must be creator or system admin to delete the team
    if (team.creatorId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only the team owner or admin can delete this team' }, { status: 403 });
    }

    await prisma.team.delete({
      where: { id: teamId }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to delete team', details: errMsg }, { status: 500 });
  }
}

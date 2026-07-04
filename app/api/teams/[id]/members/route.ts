import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamId = params.id;

  try {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    return NextResponse.json({ members });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch team members', details: errMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamId = params.id;

  try {
    const { username } = await req.json();
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required to send invite' }, { status: 400 });
    }

    const targetUsername = username.trim();

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify current user is owner or system admin
    const memberRecord = team.members.find((m: any) => m.userId === user.id);
    const isOwner = memberRecord?.role === 'owner';
    if (!isOwner && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only the team owner or admin can invite members' }, { status: 403 });
    }

    // Look up invitee user
    const invitee = await prisma.user.findUnique({
      where: { username: targetUsername }
    });

    if (!invitee) {
      return NextResponse.json({ error: `User with username "${targetUsername}" not found` }, { status: 404 });
    }

    // Check if invitee is already in the team
    const isAlreadyMember = team.members.some((m: any) => m.userId === invitee.id);
    if (isAlreadyMember) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
    }

    // Check if invitee already has a pending invitation
    const existingInvite = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        inviteeId: invitee.id,
        status: 'pending'
      }
    });

    if (existingInvite) {
      return NextResponse.json({ error: 'A pending invitation has already been sent to this user' }, { status: 400 });
    }

    // Create the invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        inviteeId: invitee.id,
        invitedById: user.id,
        status: 'pending'
      }
    });

    return NextResponse.json({ success: true, invitation });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to send invitation', details: errMsg }, { status: 500 });
  }
}

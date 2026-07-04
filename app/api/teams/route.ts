import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';

export async function GET(req: NextRequest) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            creator: {
              select: { id: true, username: true, email: true }
            },
            members: {
              include: {
                user: {
                  select: { id: true, username: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    const teams = memberships.map((m: any) => m.team);
    return NextResponse.json({ teams });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch teams', details: errMsg }, { status: 500 });
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
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const newTeam = await prisma.team.create({
      data: {
        name: name.trim(),
        creatorId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'owner'
          }
        }
      },
      include: {
        creator: {
          select: { id: true, username: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ team: newTeam });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create team', details: errMsg }, { status: 500 });
  }
}

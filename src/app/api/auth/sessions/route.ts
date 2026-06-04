import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.sessionId) {
    await prisma.userSession.updateMany({
      where: { id: session.sessionId, userId: session.userId, revokedAt: null },
      data: { lastActive: new Date() },
    });
  }

  const sessions = await prisma.userSession.findMany({
    where: { userId: session.userId },
    orderBy: { lastActive: 'desc' },
    take: 25,
  });

  const now = Date.now();
  return NextResponse.json({
    currentSessionId: session.sessionId ?? null,
    sessions: sessions.map((s) => {
      const revoked = Boolean(s.revokedAt) || s.expiresAt.getTime() <= now;
      return {
        id: s.id,
        device: s.device,
        browser: s.browser,
        os: s.os,
        ipAddress: s.ipAddress,
        location: s.location,
        createdAt: s.createdAt.toISOString(),
        lastActive: s.lastActive.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        revokedAt: s.revokedAt?.toISOString() ?? null,
        isCurrent: s.id === session.sessionId,
        status: revoked ? 'logged_out' : now - s.lastActive.getTime() <= ACTIVE_WINDOW_MS ? 'active' : 'inactive',
      };
    }),
  });
}

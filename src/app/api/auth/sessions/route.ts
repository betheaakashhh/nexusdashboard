import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

type SessionStatus = 'active' | 'signed_in' | 'logged_out';

function getSessionStatus(lastActive: Date, expiresAt: Date, revokedAt: Date | null, now: number): SessionStatus {
  if (revokedAt || expiresAt.getTime() <= now) return 'logged_out';
  return now - lastActive.getTime() <= ACTIVE_WINDOW_MS ? 'active' : 'signed_in';
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.sessionId) {
    const touch = await prisma.userSession.updateMany({
      where: {
        id: session.sessionId,
        userId: session.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { lastActive: new Date() },
    });

    if (touch.count === 0) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
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
        status: getSessionStatus(s.lastActive, s.expiresAt, s.revokedAt, now),
      };
    }),
  });
}

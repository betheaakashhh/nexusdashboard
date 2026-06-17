import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

type SessionStatus = 'active' | 'signed_in' | 'logged_out';

function getSessionStatus(lastActive: Date, expiresAt: Date, revokedAt: Date | null, now: number): SessionStatus {
  if (revokedAt || expiresAt.getTime() <= now) return 'logged_out';
  return now - lastActive.getTime() <= ACTIVE_WINDOW_MS ? 'active' : 'signed_in';
}

function formatDate(value: Date) {
  return value.toISOString();
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessions = await prisma.userSession.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();
  const lines = [
    'Nexus Dashboard Login Credentials History',
    `Generated At: ${new Date().toISOString()}`,
    `Total Login Records: ${sessions.length}`,
    '',
    ...sessions.flatMap((s, index) => [
      `#${index + 1}`,
      `Status: ${getSessionStatus(s.lastActive, s.expiresAt, s.revokedAt, now)}`,
      `Device: ${s.device}`,
      `Browser: ${s.browser}`,
      `OS: ${s.os}`,
      `IP Address: ${s.ipAddress}`,
      `Location: ${s.location}`,
      `First Login: ${formatDate(s.createdAt)}`,
      `Last Activity: ${formatDate(s.lastActive)}`,
      `Expires At: ${formatDate(s.expiresAt)}`,
      `Logged Out At: ${s.revokedAt ? formatDate(s.revokedAt) : 'Not logged out'}`,
      `User Agent: ${s.UserAgent || 'Unknown'}`,
      '',
    ]),
  ];

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="nexus-login-history-${new Date().toISOString().slice(0, 10)}.txt"`,
      'Cache-Control': 'no-store',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { clearCookieHeader, getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.userSession.updateMany({
    where: { id, userId: session.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const response = NextResponse.json({ success: true, isCurrent: id === session.sessionId });
  if (id === session.sessionId) response.headers.set('Set-Cookie', clearCookieHeader());
  return response;
}

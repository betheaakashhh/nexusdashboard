// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clearCookieHeader, getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Use NextRequest so we read the cookie from the request directly
// (avoids the Next.js 15 async cookies() issue in Route Handlers)
export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if(session.sessionId) {
      const activeSession = await prisma.userSession.findFirst({
        where:{
          id: session.sessionId,
          userId: session.userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
        if(!activeSession) {
          const response = NextResponse.json({ error: 'Session expired' }, { status: 401 });
          return response;
        }

        await prisma.userSession.update({
          where: { id: session.sessionId },
          data: { lastActive: new Date() },
        });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('/api/auth/me error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
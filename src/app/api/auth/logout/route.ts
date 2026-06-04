// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clearCookieHeader, getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (session?.sessionId) {
    await prisma.userSession.updateMany({ where: { id: session.sessionId, userId: session.userId, revoked: null }, data: { revoked: new Date() } });
  }
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', clearCookieHeader());
  return response;
}

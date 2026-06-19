// src/app/api/auth/verify-email/route.ts
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/tokens';
import {
  getClientIp,
  getRequestLocation,
  parseUserAgent,
  signToken,
  setCookieHeader,
} from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  if (!token) {
    return NextResponse.redirect(new URL('/login?verify_error=missing_token', req.url));
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/login?verify_error=invalid_or_expired', req.url));
  }

  const user = record.user;

  // Mark verified + consume the token
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  // ── Log the user in immediately, same as /api/auth/login ──
  try {
    const ua = req.headers.get('user-agent') || '';
    const parsed = parseUserAgent(ua);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        device: parsed.device,
        browser: parsed.browser,
        os: parsed.os,
        ipAddress: getClientIp(req),
        location: getRequestLocation(req),
        UserAgent: ua,
        token: randomUUID(),
        expiresAt,
      },
    });

    const jwt = signToken({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });
    await prisma.userSession.update({ where: { id: session.id }, data: { token: jwt } });

    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    response.headers.set('Set-Cookie', setCookieHeader(jwt));
    return response;
  } catch (err) {
    console.error('verify-email: auto-login after verification failed:', err);
    // Verification itself still succeeded — fall back to manual login
    return NextResponse.redirect(new URL('/login?verified=1', req.url));
  }
}
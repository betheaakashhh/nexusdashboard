// src/app/api/auth/login/route.ts
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, getClientIp, getRequestLocation, parseUserAgent, signToken, setCookieHeader } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // ── Step 1: check env vars are present ─────────────────────────────────
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not set in .env.local');
    return NextResponse.json(
      { error: 'Server misconfiguration: JWT_SECRET missing' },
      { status: 500 }
    );
  }

  if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL is not set in .env.local');
    return NextResponse.json(
      { error: 'Server misconfiguration: DATABASE_URL missing' },
      { status: 500 }
    );
  }

  // ── Step 2: parse body ──────────────────────────────────────────────────
  let email: string, password: string;
  try {
    const body = await req.json();
    email    = body.email;
    password = body.password;
  } catch (err) {
    console.error('Login: failed to parse request body:', err);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  // ── Step 3: query database ──────────────────────────────────────────────
  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (err) {
    console.error('Login: database query failed:', err);
    return NextResponse.json(
      { error: 'Database error — check DATABASE_URL and run: npx prisma generate' },
      { status: 500 }
    );
  }

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // ── Step 4: verify password ─────────────────────────────────────────────
  let valid: boolean;
  try {
    valid = await comparePassword(password, user.password);
  } catch (err) {
    console.error('Login: bcrypt compare failed:', err);
    return NextResponse.json({ error: 'Password verification error' }, { status: 500 });
  }

  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // ── Step 5: create  a tracked session and sign token  and sign cookie ───────────────────────────────────
  try {
    const ua = req.headers.get('user-agent') || '';
    const parsed = parseUserAgent(ua);
    const expiresAt  = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
    const session = await prisma.userSession.create({
      data:{
        userId: user.id,
        device: parsed.device,
        browser: parsed.browser,
        os: parsed.os,
        ipAddress: getClientIp(req),
        location: getRequestLocation(req),
        UserAgent: ua,
        token: randomUUID(), // Store a random token for session management (not used for auth)
        expiresAt,
      },
    });
    // sessionId isn't part of the JWTPayload type; cast to any to include it in the token
    const token = signToken({ userId: user.id, email: user.email, role: user.role, sessionId: session.id });
    await prisma.userSession.update({
    where: { id: session.id },
     data: { token },
    });
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
    response.headers.set('Set-Cookie', setCookieHeader(token));
    return response;
  } catch (err) {
    console.error('Login: token signing failed:', err);
    return NextResponse.json({ error: 'Token error — check JWT_SECRET' }, { status: 500 });
  }
}
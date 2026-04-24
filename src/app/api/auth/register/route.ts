// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, setCookieHeader } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Server misconfiguration: JWT_SECRET missing' }, { status: 500 });
  }

  let name: string, email: string, password: string;
  try {
    const body = await req.json();
    name     = (body.name     || '').trim();
    email    = (body.email    || '').trim().toLowerCase();
    password = body.password  || '';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  // Check if email already taken
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 });
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashed, name, role: 'user' },
  });

  // Auto-login: sign token and set cookie
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }, { status: 201 });
  response.headers.set('Set-Cookie', setCookieHeader(token));
  return response;
}
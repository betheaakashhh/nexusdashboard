import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { createSecureToken, hashToken } from '@/lib/tokens';

export async function POST(req: NextRequest) {
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

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 });
    }

    const token = createSecureToken();
    const hashed = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: 'user',
        emailVerifiedAt: null,
        emailVerificationTokens: {
          create: { tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) },
        },
      },
    });

    try {
      await sendVerificationEmail(email, token);
    } catch (emailErr) {
      console.error('register: failed to send verification email:', emailErr);
      await prisma.user.delete({ where: { email } }).catch((cleanupErr) => {
        console.error('register: failed to clean up unverified account after email failure:', cleanupErr);
      });
      return NextResponse.json(
        { error: 'Account was not created because the verification email could not be delivered. Please try again later.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: 'Account created. Please check your email to verify your account before signing in.',
      ...(process.env.NODE_ENV !== 'production' ? { verificationToken: token } : {}),
    }, { status: 201 });
  } catch (err) {
    console.error('register error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
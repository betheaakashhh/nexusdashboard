import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { createSecureToken, hashToken } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  let email = '';
  try {
    const body = await req.json();
    email = (body.email || '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Same response whether or not the account exists — avoids leaking
      // which emails are registered.
      return NextResponse.json({ message: 'If that account exists, a reset link has been sent.' });
    }

    const token = createSecureToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 1000 * 60 * 60) },
    });

    // Token is already saved — an email-provider failure shouldn't 500 the request.
    try {
      await sendPasswordResetEmail(email, token);
    } catch (emailErr) {
      console.error('forgot-password: failed to send reset email:', emailErr);
    }

    return NextResponse.json({
      message: 'If that account exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' ? { resetToken: token } : {}),
    });
  } catch (err) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
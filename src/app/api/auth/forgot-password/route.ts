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

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = createSecureToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 1000 * 60 * 60) },
    });
    await sendPasswordResetEmail(email, token);
    return NextResponse.json({ message: 'If that account exists, a reset link has been sent.', ...(process.env.NODE_ENV !== 'production' ? { resetToken: token } : {}) });
  }

  return NextResponse.json({ message: 'If that account exists, a reset link has been sent.' });
}

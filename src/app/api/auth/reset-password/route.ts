import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { hashToken } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  let token = '', password = '';
  try {
    const body = await req.json();
    token = body.token || '';
    password = body.password || '';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!token || !password) return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Reset link is invalid or expired' }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed, emailVerifiedAt: new Date() } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.userSession.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);

    return NextResponse.json({ message: 'Password updated. Please sign in with your new password.' });
  } catch (err) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
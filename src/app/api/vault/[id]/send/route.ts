// src/app/api/vault/[id]/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { Resend } from 'resend';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.vaultEntry.findFirst({ where: { id, userId: session.userId } });
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { recipientEmail } = await req.json();
  if (!recipientEmail) return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });

  const lines: string[] = [`📋 Credential Details — ${entry.name}`, ''];
  if (entry.userId_field) lines.push(`User ID / Email: ${entry.userId_field}`);
  if (entry.registrationNumber) lines.push(`Registration No.: ${entry.registrationNumber}`);
  if (entry.password) lines.push(`Password: ${entry.password}`);
  if (entry.link) lines.push(`Link: ${entry.link}`);
  if (entry.notes) lines.push(`\nNotes: ${entry.notes}`);
  lines.push('\n— Sent via Nexus Vault');

  try {
    // src/app/api/vault/[id]/send/route.ts
const { error } = await getResend().emails.send({
  from: process.env.RESEND_FROM_EMAIL!,
  to: recipientEmail,
  subject: `Credentials: ${entry.name}`,
  text: lines.join('\n'),
});
if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vault send email failed:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
// src/app/api/emails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get('tab') || 'inbox';
  const q = searchParams.get('q');

  const where: Record<string, unknown> = { userId: session.userId };

  if (tab === 'starred') {
    where.starred = true;
  } else {
    where.tab = tab;
  }

  if (q) {
    where.OR = [
      { sender: { contains: q, mode: 'insensitive' } },
      { subject: { contains: q, mode: 'insensitive' } },
    ];
  }

  const emails = await prisma.email.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ emails });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sender, senderEmail, subject, body, tab, sentAt } = await req.json();

  if (!subject || !body || !senderEmail) {
    return NextResponse.json(
      { error: 'Subject, body, and recipient email required' },
      { status: 400 }
    );
  }

  // ── Validate Resend configuration ─────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return NextResponse.json(
      { error: 'Email service not configured: RESEND_API_KEY missing' },
      { status: 500 }
    );
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.error('RESEND_FROM_EMAIL is not set');
    return NextResponse.json(
      { error: 'Email service not configured: RESEND_FROM_EMAIL missing' },
      { status: 500 }
    );
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;

  // ── Send via Resend ───────────────────────────────────────────────────────
  try {
    const sendResult = await resend.emails.send({
      from: fromEmail,
      to: senderEmail,
      subject,
      text: body,
    });

    // Resend returns { id, ... } on success or { error: { ... } } on failure
    if ('error' in sendResult && sendResult.error) {
      const errMsg = typeof sendResult.error === 'object'
        ? JSON.stringify(sendResult.error)
        : String((sendResult as unknown as { error: unknown }).error);
      console.error('Resend API error:', errMsg);
      return NextResponse.json(
        { error: `Email delivery failed: ${errMsg}` },
        { status: 502 }
      );
    }

    console.log('Resend sent OK, id:', sendResult.data?.id ?? 'unknown');
  } catch (error) {
    console.error('Resend threw exception:', error);
    return NextResponse.json(
      { error: 'Failed to send email — check RESEND_API_KEY and RESEND_FROM_EMAIL' },
      { status: 500 }
    );
  }

  // ── Save to DB ─────────────────────────────────────────────────────────────
  try {
    const email = await prisma.email.create({
      data: {
        sender: sender || 'Me',
        senderEmail,
        subject,
        body,
        preview: body.slice(0, 100),
        tab: tab || 'sent',
        unread: false,
        starred: false,
        sentAt: sentAt || new Date().toLocaleTimeString(),
        userId: session.userId,
      },
    });

    return NextResponse.json({ email }, { status: 201 });
  } catch (dbErr) {
    console.error('DB save after send error:', dbErr);
    // Email was sent — just return success even if DB save fails
    return NextResponse.json({ success: true, warning: 'Email sent but not saved to DB' }, { status: 201 });
  }
}
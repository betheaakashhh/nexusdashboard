// src/app/api/emails/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { parseEmailCSV } from '@/lib/vcf-parser';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (!file.name.toLowerCase().endsWith('.csv')) {
    return NextResponse.json({ error: 'Only .csv files supported' }, { status: 400 });
  }

  const content = await file.text();
  const parsed = parseEmailCSV(content);

  if (parsed.length === 0) {
    return NextResponse.json({ error: 'No valid emails found in file', imported: 0 }, { status: 400 });
  }

  const now = new Date().toLocaleTimeString();
  const created = await prisma.email.createMany({
    data: parsed.map((e) => ({
      sender: e.name,
      senderEmail: e.email,
      subject: e.subject || '(No Subject)',
      body: e.body || 'Imported from CSV.',
      preview: (e.body || '').slice(0, 100),
      tab: 'inbox',
      unread: true,
      starred: false,
      sentAt: now,
      userId: session.userId,
    })),
  });

  return NextResponse.json({ imported: created.count });
}

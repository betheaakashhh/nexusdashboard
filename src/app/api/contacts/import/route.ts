// src/app/api/contacts/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { parseVCF, parseContactCSV } from '@/lib/vcf-parser';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const content = await file.text();
  const fileName = file.name.toLowerCase();

  let parsed: Array<{ name: string; phone: string; email?: string }> = [];

  if (fileName.endsWith('.vcf')) {
    parsed = parseVCF(content);
  } else if (fileName.endsWith('.csv')) {
    parsed = parseContactCSV(content);
  } else {
    return NextResponse.json({ error: 'Only .vcf and .csv files supported' }, { status: 400 });
  }

  if (parsed.length === 0) {
    return NextResponse.json({ error: 'No valid contacts found in file', imported: 0 }, { status: 400 });
  }

  const created = await prisma.contact.createMany({
    data: parsed.map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email,
      tag: 'personal',
      userId: session.userId,
    })),
    skipDuplicates: false,
  });

  return NextResponse.json({ imported: created.count, message: `Imported ${created.count} contacts` });
}

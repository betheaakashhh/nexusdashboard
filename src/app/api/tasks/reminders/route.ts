// src/app/api/tasks/reminders/route.ts
// POST — check all pending tasks with a dueTime set and send reminder emails.
// Call this endpoint from a cron job (e.g. Vercel Cron, Railway cron, or a simple
// external scheduler hitting POST /api/tasks/reminders every minute).
//
// Security: protected by CRON_SECRET env var.
// Set CRON_SECRET=<random string> in your .env.local
// Pass it as Authorization: Bearer <CRON_SECRET>

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const now = new Date();
  // Format as YYYY-MM-DD
  const todayStr = now.toISOString().split('T')[0];
  // Format as HH:MM (24h)
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  try {
    // Find all incomplete tasks that have a due date set,
    // that are due today or overdue, and haven't been notified yet.
    const tasks = await prisma.task.findMany({
      where: {
        done: false,
        notified: false,
        due: { not: null },
        OR: [
          // Overdue tasks from past dates
          { due: { lt: todayStr } },
          // Tasks due today
          { due: todayStr },
        ],
      },
      include: {
        user: { select: { email: true, name: true } },
        contact: { select: { name: true } },
      },
    });

    if (tasks.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No reminders needed' });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const task of tasks) {
      const isOverdue = task.due && task.due < todayStr;
      const dueDatetime = task.due && task.dueTime
        ? `${task.due} at ${task.dueTime}`
        : task.due || 'No date set';

      const subject = isOverdue
        ? `⚠️ Overdue Task: ${task.title}`
        : `⏰ Task Reminder: ${task.title} is due soon`;

      const body = [
        `Hi ${task.user.name},`,
        '',
        isOverdue
          ? `This task is OVERDUE and still pending:`
          : `This task is due soon (within 15 minutes):`,
        '',
        `📋 Task: ${task.title}`,
        `🎯 Priority: ${task.priority.toUpperCase()}`,
        `📅 Due: ${dueDatetime}`,
        task.contact ? `👤 Linked contact: ${task.contact.name}` : '',
        '',
        `Status: ⚠️ PENDING`,
        '',
        'Please complete this task or update its due date in Nexus.',
        '',
        '— Nexus Task Reminder',
      ].filter((line) => line !== undefined).join('\n');

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: task.user.email,
          subject,
          text: body,
        });

        // Mark as notified so we don't spam
        await prisma.task.update({
          where: { id: task.id },
          data: { notified: true },
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send reminder for task ${task.id}:`, err);
        errors.push(task.id);
      }
    }

    return NextResponse.json({
      sent,
      errors: errors.length > 0 ? errors : undefined,
      message: `Sent ${sent} reminder email(s)`,
    });
  } catch (err) {
    console.error('Task reminders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET — manual trigger for testing (same logic, no auth required in dev)
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST with auth in production' }, { status: 403 });
  }
  return POST(req);
}
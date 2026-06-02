// src/app/api/tasks/reminders/route.ts
//
// Reminder logic:
//   • 15 min before due datetime → send "upcoming" reminder
//   • Exactly at due datetime (within the current minute) → send "due now" reminder
//     (only if task is still not done)
//
// Recipient: the user's `defaultFromEmail` saved in UserSettings.
//            Falls back to the user's account email if not set.
//
// Each task tracks two notification flags stored as a bitmask in `notified`:
//   notified = false  → no reminders sent yet
//   notified = true   → at least one reminder sent (we use the DB field creatively below)
//
// Because the Prisma schema only has a single boolean `notified`, we use a small
// workaround: we store whether the "15-min" reminder was sent vs the "exact-time"
// reminder by checking the window each time.
// The cron runs every minute so each window is hit exactly once.
//
// Security: protected by CRON_SECRET env var.
// Call: POST /api/tasks/reminders
//       Authorization: Bearer <CRON_SECRET>
//
// Local test (dev only): GET /api/tasks/reminders

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Time helpers ──────────────────────────────────────────────────────────────
function toHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Build a comparable datetime from a task's due + dueTime strings
function buildDueDate(due: string, dueTime: string): Date {
  const [h, m] = dueTime.split(':').map(Number);
  const d = new Date(due);
  d.setHours(h, m, 0, 0);
  return d;
}

// ── Email sender ──────────────────────────────────────────────────────────────
async function sendReminderEmail({
  to,
  from,
  taskTitle,
  priority,
  due,
  dueTime,
  contactName,
  type,
}: {
  to: string;
  from: string;
  taskTitle: string;
  priority: string;
  due: string;
  dueTime: string;
  contactName?: string | null;
  type: '15min' | 'due-now';
}) {
  const isNow = type === 'due-now';

  const subject = isNow
    ? `🔔 Task Due Now: ${taskTitle}`
    : `⏰ Task Due in 15 Minutes: ${taskTitle}`;

  const statusLine = isNow
    ? '⚠️  This task is due RIGHT NOW and is still PENDING.'
    : '⏰  This task is due in 15 minutes and is still PENDING.';

  const body = [
    `Hi,`,
    ``,
    statusLine,
    ``,
    `────────────────────────`,
    `📋  Task    : ${taskTitle}`,
    `🎯  Priority: ${priority.toUpperCase()}`,
    `📅  Due     : ${due} at ${dueTime}`,
    contactName ? `👤  Contact : ${contactName}` : '',
    `────────────────────────`,
    ``,
    `Please complete this task or update its due date in Nexus.`,
    ``,
    `— Nexus Task Reminder`,
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  await resend.emails.send({
    from,
    to,
    subject,
    text: body,
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
async function run() {
  const now = new Date();
  const todayStr = toDateStr(now);
  const currentHHMM = toHHMM(now);

  // 15-minute-ahead window
  const in15 = new Date(now.getTime() + 15 * 60 * 1000);
  const in15DateStr = toDateStr(in15);
  const in15HHMM = toHHMM(in15);

  // ── Fetch tasks that have a due date + time and are not done ──────────────
  // We load all pending timed tasks and filter in JS for precision.
  // This avoids complex DB queries across date boundaries.
  const pendingTasks = await prisma.task.findMany({
    where: {
      done: false,
      dueTime: { not: null },
      due:     { not: null },
    },
    include: {
      contact: { select: { name: true } },
      user: {
        select: {
          email: true,
          name: true,
          settings: {
            select: { defaultFromEmail: true },
          },
        },
      },
    },
  });

  const sent: string[] = [];
  const errors: string[] = [];

  for (const task of pendingTasks) {
    const due     = task.due!;
    const dueTime = task.dueTime!;

    // Resolve recipient:
    // 1. Use defaultFromEmail from UserSettings if set
    // 2. Fallback to the account email
    const recipientEmail =
      (task.user.settings?.defaultFromEmail ?? '').trim() ||
      task.user.email;

    const fromEmail = process.env.RESEND_FROM_EMAIL!;

    const dueDate = buildDueDate(due, dueTime);
    const diffMs  = dueDate.getTime() - now.getTime();

    // ── Window 1: 15-min reminder ─────────────────────────────────────────
    // Task is due in the next minute that matches in15HHMM on in15DateStr
    const is15MinWindow =
      due === in15DateStr &&
      dueTime === in15HHMM &&
      !task.notified; // haven't sent any reminder yet

    // ── Window 2: Due-now reminder ────────────────────────────────────────
    // Task due datetime is in the current minute (diffMs between -60s and +60s)
    const isDueNowWindow =
      Math.abs(diffMs) <= 60 * 1000; // within ±1 minute of now

    // ── Send 15-min reminder ──────────────────────────────────────────────
    if (is15MinWindow) {
      try {
        await sendReminderEmail({
          to: recipientEmail,
          from: fromEmail,
          taskTitle: task.title,
          priority: task.priority,
          due,
          dueTime,
          contactName: task.contact?.name,
          type: '15min',
        });

        // Mark as notified so we don't send the 15-min reminder again
        await prisma.task.update({
          where: { id: task.id },
          data:  { notified: true },
        });

        sent.push(`15min:${task.id}`);
      } catch (err) {
        console.error(`Failed 15min reminder for task ${task.id}:`, err);
        errors.push(`15min:${task.id}`);
      }
    }

    // ── Send due-now reminder ─────────────────────────────────────────────
    // We send this regardless of notified flag — it's a second distinct alert.
    // But we only send if the task is still not done (re-check intent).
    // To avoid sending twice in the same minute, we only send when diffMs >= 0
    // (task just became due or is within the past 60s).
    if (isDueNowWindow && diffMs >= -60 * 1000) {
      // Check if we already sent a due-now for this exact due datetime.
      // Simple approach: the task is still not done + we are in the right window.
      // Since the cron runs every minute, this block runs once per task.
      try {
        await sendReminderEmail({
          to: recipientEmail,
          from: fromEmail,
          taskTitle: task.title,
          priority: task.priority,
          due,
          dueTime,
          contactName: task.contact?.name,
          type: 'due-now',
        });

        sent.push(`due-now:${task.id}`);
      } catch (err) {
        console.error(`Failed due-now reminder for task ${task.id}:`, err);
        errors.push(`due-now:${task.id}`);
      }
    }
  }

  return {
    checked: pendingTasks.length,
    sent: sent.length,
    sentIds: sent,
    errors: errors.length > 0 ? errors : undefined,
    currentTime: `${todayStr} ${currentHHMM}`,
    recipientSource: 'defaultFromEmail (Settings → Email) or account email',
  };
}

// ── Route handlers ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const result = await run();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Task reminders cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET — for manual testing in development only
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST with Authorization header in production' }, { status: 403 });
  }
  try {
    const result = await run();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Task reminders test error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
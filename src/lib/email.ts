const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || '';
const FROM_NAME  = process.env.BREVO_FROM_NAME  || 'Nexus';

export class EmailDeliveryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

function assertConfigured() {
  if (!process.env.BREVO_API_KEY) {
    throw new EmailDeliveryError('BREVO_API_KEY is not configured.');
  }
  if (!FROM_EMAIL) {
    throw new EmailDeliveryError('BREVO_FROM_EMAIL is not configured.');
  }
}

/**
 * Low-level Brevo sender. Throws EmailDeliveryError on failure.
 * Exported so API routes can use it directly for transactional sends.
 */
export async function sendBrevoEmail({
  to,
  subject,
  html,
  text,
  fromEmail = FROM_EMAIL,
  fromName  = FROM_NAME,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
}) {
  assertConfigured();

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      ...(html ? { htmlContent: html } : {}),
      ...(text ? { textContent: text } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new EmailDeliveryError(
      err.message || `Brevo API returned ${res.status}`,
      err,
    );
  }

  return res.json();
}

// ── Auth emails ───────────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${getAppUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  return sendBrevoEmail({
    to: email,
    subject: 'Verify your Nexus account',
    html: `
      <p>Welcome to Nexus.</p>
      <p>Verify your email address to finish setting up your account:</p>
      <p><a href="${url}">Verify email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return sendBrevoEmail({
    to: email,
    subject: 'Reset your Nexus password',
    html: `
      <p>We received a request to reset your Nexus password.</p>
      <p><a href="${url}">Click here to RESET PASSWORD</a></p>
      <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
    `,
  });
}
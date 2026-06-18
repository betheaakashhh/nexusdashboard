import { Resend } from 'resend';

const DEFAULT_RESEND_FROM = 'Nexus <onboarding@resend.dev>';
const FROM_EMAIL = process.env.AUTH_EMAIL_FROM || DEFAULT_RESEND_FROM;

type ResendSendResult = Awaited<ReturnType<Resend['emails']['send']>>;

export class EmailDeliveryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || 'http://localhost:3000').replace(/\/$/, '');
}

function assertEmailConfigured() {
  if (!process.env.RESEND_API_KEY) {
    throw new EmailDeliveryError('RESEND_API_KEY is not configured.');
  }

  if (process.env.NODE_ENV === 'production' && FROM_EMAIL === DEFAULT_RESEND_FROM) {
    throw new EmailDeliveryError(
      'AUTH_EMAIL_FROM must use a verified sending domain in production. Resend onboarding@resend.dev only delivers to your verified account email.',
    );
  }
}

function assertEmailAccepted(result: ResendSendResult) {
  if (result && 'error' in result && result.error) {
    const message =
      typeof result.error === 'object' && 'message' in result.error && typeof result.error.message === 'string'
        ? result.error.message
        : 'Email provider rejected the message.';
    throw new EmailDeliveryError(message, result.error);
  }
}

async function sendMail(to: string, subject: string, html: string) {
  assertEmailConfigured();

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  assertEmailAccepted(result);
  return result;
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${getAppUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  return sendMail(email, 'Verify your Nexus account', `
    <p>Welcome to Nexus.</p>
    <p>Verify your email address to finish setting up your account:</p>
    <p><a href="${url}">Verify email</a></p>
    <p>This link expires in 24 hours.</p>
  `);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return sendMail(email, 'Reset your Nexus password', `
    <p>We received a request to reset your Nexus password.</p>
    <p><a href="${url}">Reset password</a></p>
    <p>This link expires in 1 hour. If you did not request it, you can ignore this email.</p>
  `);
}

import { Resend } from 'resend';

const FROM_EMAIL = process.env.AUTH_EMAIL_FROM || 'Nexus <onboarding@resend.dev>';

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || 'http://localhost:3000').replace(/\/$/, '');
}

async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`Email not sent to ${to}: RESEND_API_KEY is not configured.`);
    return { skipped: true };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({ from: FROM_EMAIL, to, subject, html });
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

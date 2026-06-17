'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Unable to send reset link');
        return;
      }
      setSent(true);
      if (data.resetToken) setDevToken(data.resetToken);
      toast.success(data.message || 'Reset link sent');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0d0d0c', color: '#e5e5e2', padding: 24 }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380, background: '#141412', border: '1px solid rgba(232,229,220,0.10)', borderRadius: 16, padding: 28 }}>
        <h1 style={{ marginBottom: 8 }}>Reset password</h1>
        <p style={{ color: '#888784', fontSize: 14, marginBottom: 20 }}>Enter your account email and we will send a secure reset link.</p>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(232,229,220,0.16)', background: '#0d0d0c', color: '#e5e5e2', marginBottom: 14 }} />
        <button disabled={loading || sent} style={{ width: '100%', padding: 12, border: 0, borderRadius: 10, background: '#c4a882', color: '#1a1a18', fontWeight: 700 }}>{sent ? 'Check your email' : loading ? 'Sending…' : 'Send reset link'}</button>
        <a href="/login" style={{ display: 'block', marginTop: 16, color: '#b8956a', textAlign: 'center' }}>Back to sign in</a>
      </form>
    </main>
  );
}
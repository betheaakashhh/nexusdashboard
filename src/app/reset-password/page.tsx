'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Unable to reset password');
      toast.success(data.message || 'Password updated');
      setTimeout(() => window.location.replace('/login'), 1200);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0d0d0c', color: '#e5e5e2', padding: 24 }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380, background: '#141412', border: '1px solid rgba(232,229,220,0.10)', borderRadius: 16, padding: 28 }}>
        <h1 style={{ marginBottom: 8 }}>Choose a new password</h1>
        <p style={{ color: '#888784', fontSize: 14, marginBottom: 20 }}>Use at least 8 characters.</p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="New password" style={inputStyle} />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Confirm password" style={inputStyle} />
        <button disabled={loading || !token} style={{ width: '100%', padding: 12, border: 0, borderRadius: 10, background: '#c4a882', color: '#1a1a18', fontWeight: 700 }}>{loading ? 'Updating…' : 'Update password'}</button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(232,229,220,0.16)', background: '#0d0d0c', color: '#e5e5e2', marginBottom: 14 };

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordsMatch = password === confirm;
  const canSubmit = Boolean(token) && password.length >= 8 && confirm.length >= 8 && passwordsMatch && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      if (!token) return toast.error('Reset link is missing or invalid');
      if (password.length < 8) return toast.error('Password must be at least 8 characters');
      if (confirm.length < 8) return toast.error('Confirm password must be at least 8 characters');
      if (!passwordsMatch) return toast.error('Passwords do not match');
      return;
    }
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
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380, background: '#141412', border: '1px solid rgba(232,229,220,0.10)', borderRadius: 16, padding: 28 }}>
      <h1 style={{ marginBottom: 8 }}>Choose a new password</h1>
      <p style={{ color: '#888784', fontSize: 14, marginBottom: 20 }}>Use at least 8 characters.</p>
      <PasswordField
        value={password}
        onChange={setPassword}
        placeholder="New password"
        show={showPassword}
        onToggleShow={() => setShowPassword((value) => !value)}
      />
      <PasswordField
        value={confirm}
        onChange={setConfirm}
        placeholder="Confirm password"
        show={showConfirm}
        onToggleShow={() => setShowConfirm((value) => !value)}
        hasError={Boolean(confirm) && !passwordsMatch}
      />
      {confirm && !passwordsMatch && (
        <p role="alert" style={{ color: '#ff7b7b', fontSize: 13, margin: '-6px 0 14px' }}>
          Passwords do not match.
        </p>
      )}
      <button
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
        style={{
          width: '100%',
          padding: 12,
          border: 0,
          borderRadius: 10,
          background: canSubmit ? '#c4a882' : 'rgba(196,168,130,0.45)',
          color: canSubmit ? '#1a1a18' : 'rgba(26,26,24,0.65)',
          fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'background 160ms ease, color 160ms ease, opacity 160ms ease',
        }}
      >
        {loading ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}

function PasswordField({
  value,
  onChange,
  placeholder,
  show,
  onToggleShow,
  hasError = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  show: boolean;
  onToggleShow: () => void;
  hasError?: boolean;
}) {
  return (
    <div style={{ position: 'relative', marginBottom: 14 }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder={placeholder}
        style={{
          ...inputStyle,
          marginBottom: 0,
          paddingRight: 74,
          borderColor: hasError ? '#ff7b7b' : 'rgba(232,229,220,0.16)',
        }}
      />
      <button
        type="button"
        onClick={onToggleShow}
        aria-label={show ? `Hide ${placeholder.toLowerCase()}` : `Show ${placeholder.toLowerCase()}`}
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          border: 0,
          borderRadius: 8,
          background: 'rgba(196,168,130,0.16)',
          color: '#c4a882',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          padding: '6px 9px',
        }}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0d0d0c', color: '#e5e5e2', padding: 24 }}>
      <Suspense fallback={<div style={{ color: '#888784' }}>Loading reset form…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(232,229,220,0.16)', background: '#0d0d0c', color: '#e5e5e2', marginBottom: 14 };

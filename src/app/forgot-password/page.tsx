'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
      toast.success(data.message || 'Reset link sent');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body { min-height: 100%; background: #0d0d0c; }
        @keyframes _spin { to { transform: rotate(360deg); } }
        .reset-input {
          width: 100%;
          padding: 13px 15px;
          border-radius: 12px;
          border: 1px solid rgba(232,229,220,0.12);
          background: #0d0d0c;
          color: #e5e5e2;
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .reset-input::placeholder { color: #555552; }
        .reset-input:focus {
          border-color: rgba(196,168,130,0.55);
          box-shadow: 0 0 0 4px rgba(196,168,130,0.08);
        }
        .reset-link {
          color: #b8956a;
          text-decoration: none;
          font-weight: 700;
        }
        .reset-link:hover { color: #c4a882; text-decoration: underline; text-underline-offset: 3px; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(circle at top, rgba(196,168,130,0.13), transparent 34%), #0d0d0c',
        color: '#e5e5e2',
        padding: 24,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <section style={{ width: '100%', maxWidth: 430 }}>
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 44,
              letterSpacing: '-2px',
              background: 'linear-gradient(140deg, #e5e5e2 0%, #c4a882 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
            }}>
              Nexus
            </div>
            <p style={{ marginTop: 8, color: '#686761', fontSize: 13 }}>Recover access to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} style={{
            background: 'rgba(20,20,18,0.92)',
            border: '1px solid rgba(232,229,220,0.10)',
            borderRadius: 22,
            padding: 30,
            boxShadow: '0 24px 80px rgba(0,0,0,0.32)',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(196,168,130,0.12)',
              color: '#c4a882',
              marginBottom: 18,
              fontSize: 24,
            }} aria-hidden="true">
              ↻
            </div>

            <h1 style={{ margin: '0 0 8px', fontFamily: "'Syne', sans-serif", fontSize: 28, letterSpacing: '-0.8px' }}>
              Forgot password?
            </h1>
            <p style={{ color: '#888784', fontSize: 14, lineHeight: 1.6, margin: '0 0 22px' }}>
              Enter your account email and we&apos;ll show the next step by sending a secure password reset link if the account exists.
            </p>

            {sent && (
              <div style={{
                border: '1px solid rgba(99, 214, 154, 0.22)',
                background: 'rgba(99, 214, 154, 0.08)',
                color: '#b8f0cf',
                borderRadius: 14,
                padding: '12px 14px',
                fontSize: 13,
                lineHeight: 1.5,
                marginBottom: 16,
              }}>
                Check your inbox for a reset link. You can resend it by editing the email below and submitting again.
              </div>
            )}

            <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888784', marginBottom: 8 }}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              autoComplete="email"
              className="reset-input"
              style={{ marginBottom: 16 }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 13,
                border: 0,
                borderRadius: 12,
                background: loading ? 'rgba(196,168,130,0.22)' : '#c4a882',
                color: loading ? 'rgba(255,255,255,0.4)' : '#1a1a18',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(26,26,24,0.18)', borderTopColor: '#1a1a18', borderRadius: '50%', animation: '_spin 0.7s linear infinite' }} />}
              {loading ? 'Sending reset link…' : sent ? 'Resend reset link' : 'Send reset link'}
            </button>

            <p style={{ textAlign: 'center', color: '#686761', fontSize: 13, margin: '18px 0 0' }}>
              Remember your password? <Link href="/login" className="reset-link">Back to sign in</Link>
            </p>
          </form>
        </section>
      </main>
    </>
  );
}

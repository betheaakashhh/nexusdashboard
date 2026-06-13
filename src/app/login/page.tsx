'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const PRODUCTS = [
  { name: 'AetherSolve',        url: 'https://aethersolve.vercel.app' },
  { name: 'aether.ai',          url: 'https://aethersolve.vercel.app/services/aipage' },
  { name: 'Timedule',           url: 'https://timedule.onrender.com' },
  { name: 'Resunova Builder',   url: 'https://resunovabuilder.vercel.app' },
  { name: 'Wedding Studio Pro', url: 'https://wedding-studio-pro.lovable.app' },
];

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Login failed'); setLoading(false); return; }

      let attempts = 0;
      const check = async () => {
        attempts++;
        try {
          const r = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
          if (r.ok) { toast.success('Welcome back!'); window.location.replace('/dashboard/contacts'); return; }
        } catch { /* ignore */ }
        if (attempts < 10) setTimeout(check, 150);
        else window.location.replace('/dashboard/contacts');
      };
      setTimeout(check, 200);
    } catch {
      toast.error('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #0d0d0c; }
        @keyframes _spin { to { transform: rotate(360deg); } }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #141412 inset !important;
          -webkit-text-fill-color: #e5e5e2 !important;
          caret-color: #e5e5e2;
        }

        .nx-input {
          width: 100%;
          background: #141412;
          border: 1px solid rgba(232,229,220,0.10);
          border-radius: 10px;
          padding: 12px 16px;
          color: #e5e5e2;
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px;
          outline: none;
          transition: border-color 0.15s;
        }
        .nx-input::placeholder { color: #484845; }
        .nx-input:focus        { border-color: rgba(196,168,130,0.45); }

        .nx-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.15s, transform 0.1s;
        }
        .nx-btn:hover:not(:disabled)  { opacity: 0.87; }
        .nx-btn:active:not(:disabled) { transform: scale(0.99); }
        .nx-btn:disabled              { cursor: not-allowed; }

        .nx-help { color: #686761; text-decoration: none; font-size: 12px; transition: color 0.15s; }
        .nx-help:hover { color: #a8a5a0; text-decoration: underline; text-underline-offset: 3px; }

        .nx-register { color: #b8956a; text-decoration: none; font-weight: 500; transition: color 0.15s; }
        .nx-register:hover { color: #c4a882; text-decoration: underline; text-underline-offset: 3px; }

        .nx-footer-link {
          color: #555552;
          text-decoration: none;
          font-size: 12px;
          white-space: nowrap;
          transition: color 0.15s, text-decoration-color 0.15s;
        }
        .nx-footer-link:hover {
          color: #c4a882;
          text-decoration: underline;
          text-decoration-color: rgba(196,168,130,0.5);
          text-underline-offset: 3px;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0d0c',
        fontFamily: "'DM Sans', sans-serif",
        color: '#e5e5e2',
        padding: '40px 24px',
      }}>

        {/* ── FORM COLUMN ── */}
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* brand */}
          <div style={{ textAlign: 'center', marginBottom: 38 }}>
            <div style={{
              fontFamily:            "'Syne', sans-serif",
              fontWeight:            800,
              fontSize:              46,
              letterSpacing:         '-2.5px',
              background:            'linear-gradient(140deg, #e5e5e2 0%, #c4a882 100%)',
              WebkitBackgroundClip:  'text',
              WebkitTextFillColor:   'transparent',
              lineHeight:            1,
              marginBottom:          8,
            }}>
              Nexus
            </div>
            <div style={{ fontSize: 13, color: '#686761' }}>
              Sign in to your workspace
            </div>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit}>

            {/* email */}
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="email" style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: '#888784', marginBottom: 7,
              }}>
                Email address
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="nx-input"
              />
            </div>

            {/* password */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 7,
              }}>
                <label htmlFor="password" style={{
                  fontSize: 12, fontWeight: 500, color: '#888784',
                }}>
                  Password
                </label>
                <a href="#" className="nx-help">Forgot password?</a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="nx-input"
              />
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="nx-btn"
              style={{
                background: loading ? 'rgba(196,168,130,0.22)' : '#c4a882',
                color:      loading ? 'rgba(255,255,255,0.35)' : '#1a1a18',
              }}
            >
              {loading && (
                <span style={{
                  width: 14, height: 14, flexShrink: 0,
                  border: '2px solid rgba(26,26,24,0.18)',
                  borderTopColor: '#1a1a18',
                  borderRadius: '50%',
                  animation: '_spin 0.7s linear infinite',
                  display: 'inline-block',
                }} />
              )}
              {loading ? 'Signing in…' : 'Continue'}
            </button>
          </form>

          {/* register nudge */}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#686761' }}>
            Don&apos;t have an account?{' '}
            <a href="/register" className="nx-register">Create one</a>
          </p>
        </div>

        {/* ── FOOTER PRODUCT LINKS ── */}
        <div style={{
          marginTop: 60,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 6px',
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: 480,
        }}>
          {PRODUCTS.map((p, i) => (
            <span key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="nx-footer-link">
                {p.name}
              </a>
              {i < PRODUCTS.length - 1 && (
                <span style={{ color: 'rgba(232,229,220,0.10)', fontSize: 13, lineHeight: 1 }}>·</span>
              )}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: '#303030' }}>
          © {new Date().getFullYear()} AetherSolve
        </div>
      </div>
    </>
  );
}
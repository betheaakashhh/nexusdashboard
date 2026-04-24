'use client';
// src/app/login/page.tsx  — updated to include Register link
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      let attempts = 0;
      const checkAndRedirect = async () => {
        attempts++;
        try {
          const check = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
          if (check.ok) { toast.success('Welcome back!'); window.location.replace('/dashboard/contacts'); return; }
        } catch { /* ignore */ }
        if (attempts < 10) setTimeout(checkAndRedirect, 150);
        else window.location.replace('/dashboard/contacts');
      };
      setTimeout(checkAndRedirect, 200);

    } catch {
      toast.error('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.07) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '380px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '36px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '28px', letterSpacing: '-1px', background: 'linear-gradient(135deg, #8b7fff, #ff6b9d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px' }}>
            Nexus
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Sign in to your dashboard</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input ref={emailRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--border)')} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--border)')} />
          </div>

          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{ width: '100%', padding: '11px', background: loading ? 'var(--accent3)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r2)', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-syne)', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
            {loading ? 'Signing in…' : 'Sign In'}
          </motion.button>
        </form>

        {/* Register link */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12.5px', color: 'var(--text3)' }}>
          New here?{' '}
          <a href="/register" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 500 }}>
            Create an account
          </a>
        </div>
      </motion.div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'var(--font-syne)', fontWeight: 600, marginBottom: '6px' };
const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '10px 14px', color: 'var(--text)', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s' };
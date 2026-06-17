'use client';
// src/app/register/page.tsx
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !password || !confirm) {
      toast.error('All fields are required');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      toast.success(data.message || 'Account created! Please verify your email before signing in.');
      setLoading(false);
      setTimeout(() => window.location.replace('/login'), 1800);

    } catch {
      toast.error('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.07) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '300px', height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,157,0.05) 0%, transparent 70%)',
        top: '20%', left: '20%',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)',
          padding: '36px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: '28px',
            letterSpacing: '-1px',
            background: 'linear-gradient(135deg, #8b7fff, #ff6b9d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '6px',
          }}>
            Nexus
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Create your account</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              style={{
                ...inputStyle,
                borderColor: confirm && confirm !== password ? 'var(--red)' : 'var(--border)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = confirm !== password ? 'var(--red)' : 'var(--accent)')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = confirm && confirm !== password ? 'var(--red)' : 'var(--border)')}
            />
            {confirm && confirm !== password && (
              <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>Passwords do not match</div>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              width: '100%',
              padding: '11px',
              background: loading ? 'var(--accent3)' : 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r2)',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'var(--font-syne)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading && (
              <span style={{
                width: '14px', height: '14px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                display: 'inline-block',
              }} />
            )}
            {loading ? 'Creating account…' : 'Create Account'}
          </motion.button>
        </form>

        {/* Link to login */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12.5px', color: 'var(--text3)' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </a>
        </div>

        {/* Info note */}
        <div style={{
          marginTop: '16px',
          padding: '10px 12px',
          background: 'var(--bg3)',
          borderRadius: 'var(--r2)',
          border: '1px solid var(--border)',
          fontSize: '11.5px',
          color: 'var(--text3)',
          lineHeight: 1.6,
        }}>
          Your data is private. Verify your email after registering to activate sign-in.
        </div>
      </motion.div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'var(--text3)',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  fontFamily: 'var(--font-syne)',
  fontWeight: 600,
  marginBottom: '6px',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r2)',
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s',
};
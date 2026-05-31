'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const PRODUCTS = [
  {
    id: 'aether',
    icon: '⚡',
    name: 'AetherSolve',
    badge: 'PLATFORM',
    description:
      'Premier IT services & product company delivering AI automation, custom ERP/CRM, web & mobile apps, and managed cloud infrastructure — built for mid-size Indian businesses.',
    features: ['AI Automation', 'ERP & CRM', 'Cloud Hosting', 'Web & Mobile', '24/7 Support'],
    url: 'https://aethersolve.vercel.app',
  },
  {
    id: 'aethsai',
    icon: '🧠',
    name: 'aether.ai',
    badge: 'AI TOOL',
    description:
      'AI-powered internal tools built on your actual business data. Connect documents, workflows, and databases — then query them in natural language with context-aware intelligence.',
    features: ['Custom LLM', 'Doc Q&A', 'RAG Pipeline', 'Private Models', 'Internal Tools'],
    url: 'https://aethersolve.vercel.app/services/aipage',
  },
  {
    id: 'timedule',
    icon: '⏳',
    name: 'Timedule',
    badge: 'SCHEDULING',
    description:
      'Your intelligent scheduling companion. Plan daily tasks, set smart reminders, and build lasting habits with a beautiful timeline interface made for freelancers and teams.',
    features: ['Task Timeline', 'Reminders', 'Habit Tracking', 'Team Sharing', 'Daily Planner'],
    url: 'https://timedule.onrender.com',
  },
  {
    id: 'resunova',
    icon: '📄',
    name: 'Resunova Builder',
    badge: 'CAREER TOOL',
    description:
      'Craft modern, ATS-friendly resumes in minutes. Hand-crafted templates, AI-powered writing suggestions, and one-click PDF export ready to impress any recruiter.',
    features: ['ATS-Friendly', 'AI Writing', 'PDF Export', 'Templates', 'Smart Sections'],
    url: 'https://resunovabuilder.vercel.app',
  },
  {
    id: 'wedding',
    icon: '💍',
    name: 'Wedding Studio Pro',
    badge: 'EVENT PLANNER',
    description:
      'All-in-one planner for couples — manage guest lists, vendor contracts, budgets, and timelines with elegance, so you can stay fully present on the big day.',
    features: ['Guest Lists', 'Vendor Mgmt', 'Budgeting', 'Timeline', 'Seating Planner'],
    url: 'https://wedding-studio-pro.lovable.app',
  },
];

const SLIDES = [
  {
    num: '01 / 04',
    chip: 'About',
    title: 'We automate operations\nthat cost you time.',
    subtitle: '"AI automation for businesses running on Excel, WhatsApp & manual processes."',
    body: 'AetherSolve builds AI-powered systems for mid-size businesses — connecting your data, workflows, and teams into one intelligent operation. No generic dashboards. No demo bots. Systems that actually run your business.',
    tags: [],
    stats: [
      { val: '99.97%', lbl: 'Platform uptime' },
      { val: '10M+', lbl: 'Requests/day' },
      { val: 'Tier 2', lbl: 'India focused' },
    ],
    accent: 'rgba(196,168,130,0.25)',
  },
  {
    num: '02 / 04',
    chip: 'AI Automation',
    title: 'Automate the work\nthat slows you down.',
    subtitle: 'RAG pipelines · WhatsApp bots · Document intelligence',
    body: 'Automated workflows, intelligent document processing, predictive operations, and LLM-powered internal tools — built on your actual data, not generic models. We connect Tally, Excel, and WhatsApp into one intelligent system.',
    tags: ['RAG Pipelines', 'WhatsApp Automation', 'Doc Intelligence', 'Workflow Bots', 'LLM Tools'],
    stats: [],
    accent: 'rgba(143,170,150,0.22)',
  },
  {
    num: '03 / 04',
    chip: 'Services',
    title: 'Full-stack. Cloud-native.\nAI-first, always.',
    subtitle: 'From the first pixel to production infrastructure',
    body: 'Custom ERP & CRM with AI from day one. HR, payroll, inventory, and sales — unified and intelligent. Hosted on AWS/GCP with 24/7 monitoring, CI/CD pipelines, and auto-scaling that never lets you down.',
    tags: ['Next.js / React', 'React Native', 'Node.js', 'AWS / GCP', 'ERP / CRM', 'UI/UX Design'],
    stats: [],
    accent: 'rgba(184,149,106,0.22)',
  },
  {
    num: '04 / 04',
    chip: "Let's Connect",
    title: 'Start your next\ndigital chapter.',
    subtitle: 'Bhilai, Chhattisgarh · hello@aethersolve.com',
    body: "Whether you're validating an MVP or scaling enterprise operations — AetherSolve sits with you, understands your actual workflow, and builds something that runs without constant intervention. First consultation is free.",
    tags: [],
    stats: [
      { val: 'Build', lbl: 'One-time' },
      { val: 'Host', lbl: 'Monthly' },
      { val: 'Grow', lbl: '+ AI retainer' },
    ],
    accent: 'rgba(212,184,150,0.2)',
  },
];

const SERVICES = [
  { icon: '🤖', name: 'AI Automation', desc: 'RAG & workflow bots' },
  { icon: '🌐', name: 'Web Dev', desc: 'Next.js / React apps' },
  { icon: '📱', name: 'Mobile Apps', desc: 'iOS & Android' },
  { icon: '🏭', name: 'ERP / CRM', desc: 'Custom operations' },
  { icon: '☁️', name: 'Cloud Hosting', desc: 'AWS/GCP + 24/7' },
  { icon: '🎨', name: 'UI/UX Design', desc: 'Pixel-perfect interfaces' },
];

// ─────────────────────────────────────────────
// STYLE TOKENS (inline — no Tailwind / CSS modules needed)
// ─────────────────────────────────────────────
const C = {
  bg:      '#1a1a18',   // deepest — main page bg
  bg2:     '#1f1f1e',   // card surfaces
  bg3:     '#252523',   // input / inner surfaces
  bg4:     '#2c2c2a',   // hover / raised
  border:  'rgba(232,229,220,0.07)',
  border2: 'rgba(232,229,220,0.13)',
  text:    '#e5e5e2',   // primary text
  text2:   '#a8a5a0',   // secondary text
  text3:   '#686761',   // muted / placeholder
  accent:  '#c4a882',   // warm sand — primary CTA
  accent2: '#b8956a',   // deeper amber-tan
  accent3: '#d4b896',   // light warm highlight
  teal:    '#8faa96',   // muted sage green (replaces teal)
};

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function LiveDot() {
  return (
    <motion.span
      animate={{ opacity: [1, 0.3, 1], scale: [1, 0.75, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: C.teal,
        marginRight: 7,
      }}
    />
  );
}

interface ProductPanelProps {
  product: (typeof PRODUCTS)[number];
  anchorY: number;
}
function ProductPanel({ product, anchorY }: ProductPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        right: 'calc(10% + 14px)',
        top: anchorY,
        width: 292,
        background: C.bg2,
        border: `1px solid ${C.border2}`,
        borderRadius: 14,
        padding: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {/* caret */}
      <div
        style={{
          position: 'absolute',
          right: -6,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          width: 12,
          height: 12,
          background: C.bg2,
          borderRight: `1px solid ${C.border2}`,
          borderTop: `1px solid ${C.border2}`,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 10,
            background: C.bg3,
            border: `1px solid ${C.border2}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {product.icon}
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 15,
              color: C.text,
              letterSpacing: '-0.3px',
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              marginTop: 3,
              display: 'inline-block',
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              color: C.teal,
              background: 'rgba(143,170,150,0.1)',
              border: '1px solid rgba(143,170,150,0.22)',
              borderRadius: 4,
              padding: '2px 7px',
              letterSpacing: '0.5px',
            }}
          >
            {product.badge}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.65, marginBottom: 12 }}>
        {product.description}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {product.features.map((f) => (
          <span
            key={f}
            style={{
              background: C.bg4,
              border: `1px solid ${C.border}`,
              borderRadius: 5,
              padding: '3px 9px',
              fontSize: 10,
              color: C.text3,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {f}
          </span>
        ))}
      </div>

      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          color: C.accent2,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "'Syne', sans-serif",
          textDecoration: 'none',
          pointerEvents: 'auto',
        }}
      >
        Visit site <span style={{ fontSize: 10 }}>↗</span>
      </a>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function LoginPage() {
  // --- login ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

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

  // --- slider ---
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const goTo = useCallback((idx: number) => {
    setDirection(idx > activeSlide ? 1 : -1);
    setActiveSlide(((idx % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, [activeSlide]);
  const prev = () => goTo(activeSlide - 1);
  const next = () => goTo(activeSlide + 1);

  // auto-advance
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => goTo(activeSlide + 1), 5500);
    return () => clearInterval(t);
  }, [activeSlide, paused, goTo]);

  // --- product hover ---
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [panelY, setPanelY] = useState(0);
  const btnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function handleProdEnter(id: string) {
    setHoveredProduct(id);
    const el = btnRefs.current[id];
    if (el) {
      const rect = el.getBoundingClientRect();
      const panelH = 260;
      let y = rect.top + rect.height / 2 - panelH / 2;
      y = Math.max(16, Math.min(y, window.innerHeight - panelH - 16));
      setPanelY(y);
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  const activeProductData = PRODUCTS.find((p) => p.id === hoveredProduct) ?? null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; background: #1a1a18; }
        @keyframes nexusSpin { to { transform: rotate(360deg); } }
        @keyframes nexusTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #252523 inset !important;
          -webkit-text-fill-color: #e5e5e2 !important;
          caret-color: #e5e5e2;
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
          color: C.text,
          background: '#1a1a18',
          position: 'relative',
        }}
      >

        {/* ══════════════════════════════════════════
            LEFT  40% — LOGIN
        ══════════════════════════════════════════ */}
        <div
          style={{
            width: '40%',
            minWidth: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 44px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ambient glow */}
          <div
            style={{
              position: 'absolute',
              width: 560,
              height: 560,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(196,168,130,0.08) 0%, transparent 65%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              pointerEvents: 'none',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: '100%',
              maxWidth: 400,
              background: C.bg2,
              border: `1px solid ${C.border2}`,
              borderRadius: 16,
              padding: '40px 36px',
              position: 'relative',
              zIndex: 1,
              /* gradient border shimmer */
              boxShadow: '0 0 0 1px rgba(196,168,130,0.12), 0 32px 72px rgba(0,0,0,0.45)',
            }}
          >
            {/* top accent line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '15%',
                right: '15%',
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(196,168,130,0.6), transparent)',
                borderRadius: 1,
              }}
            />

            {/* branding */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 40,
                  letterSpacing: '-2px',
                  background: 'linear-gradient(135deg, #e5e5e2 0%, #c4a882 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                  marginBottom: 7,
                }}
              >
                Nexus
              </motion.div>
              <div style={{ fontSize: 11, color: C.text3, letterSpacing: 0.3 }}>
                a product by{' '}
                <a
                  href="https://aethersolve.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.text2, textDecoration: 'none', fontWeight: 600 }}
                >
                  AetherSolve
                </a>
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: C.text3 }}>
                Sign in to your workspace
              </div>
            </div>

            {/* divider */}
            <div style={{ height: 1, background: C.border, marginBottom: 28 }} />

            {/* form */}
            <form onSubmit={handleSubmit}>
              {[
                { id: 'email', label: 'Email address', type: 'email', placeholder: 'you@company.com', value: email, setter: setEmail, ref: emailRef },
                { id: 'password', label: 'Password', type: 'password', placeholder: '••••••••', value: password, setter: setPassword, ref: null },
              ].map(({ id, label, type, placeholder, value, setter, ref }, i) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.35 }}
                  style={{ marginBottom: i === 0 ? 18 : 26 }}
                >
                  <label
                    htmlFor={id}
                    style={{
                      display: 'block',
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px',
                      color: C.text3,
                      marginBottom: 8,
                    }}
                  >
                    {label}
                  </label>
                  <input
                    ref={ref as React.RefObject<HTMLInputElement>}
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    required
                    autoComplete={type === 'email' ? 'email' : 'current-password'}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.accent;
                      e.currentTarget.style.boxShadow = `0 0 0 3px rgba(196,168,130,0.14)`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    style={{
                      width: '100%',
                      background: C.bg3,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '11px 14px',
                      color: C.text,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  />
                </motion.div>
              ))}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={loading ? {} : { scale: 1.01, opacity: 0.92 }}
                whileTap={loading ? {} : { scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.35 }}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: loading ? 'rgba(196,168,130,0.3)' : 'linear-gradient(135deg, #c4a882, #a07850)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading && (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.25)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'nexusSpin 0.7s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                )}
                {loading ? 'Signing in…' : 'Sign In'}
              </motion.button>
            </form>

            <div
              style={{
                marginTop: 18,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                fontSize: 12,
                color: C.text3,
              }}
            >
              <a href="#" style={{ color: C.text3, textDecoration: 'none' }}>Forgot password?</a>
              <span style={{ opacity: 0.3 }}>·</span>
              <a href="/register" style={{ color: C.accent2, textDecoration: 'none', fontWeight: 500 }}>
                Create account ↗
              </a>
            </div>

            {/* divider */}
            <div style={{ height: 1, background: C.border, margin: '24px 0' }} />

            {/* platform stats */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: '99.97%', lbl: 'Uptime' },
                { val: '<120ms', lbl: 'Response' },
                { val: '10M+', lbl: 'Req/Day' },
              ].map(({ val, lbl }) => (
                <div
                  key={lbl}
                  style={{
                    flex: 1,
                    background: C.bg3,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '10px 8px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.teal,
                    }}
                  >
                    {val}
                  </div>
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════
            CENTER  50% — AETHERSOLVE SHOWCASE
        ══════════════════════════════════════════ */}
        <div
          style={{
            width: '50%',
            borderLeft: `1px solid ${C.border}`,
            borderRight: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            padding: '36px 40px 28px',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* ambient glows */}
          <div style={{ position: 'absolute', top: -100, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,168,130,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -60, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(143,170,150,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

          {/* header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 28,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: 26,
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(135deg, #e5e5e2, #c4a882)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                AetherSolve
              </div>
              <div style={{ fontSize: 12, color: C.text3, marginTop: 3, fontStyle: 'italic' }}>
                Building Tomorrow's Solutions Today
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(143,170,150,0.08)',
                border: '1px solid rgba(143,170,150,0.2)',
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 11,
                color: C.teal,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                letterSpacing: '0.5px',
              }}
            >
              <LiveDot />
              LIVE PLATFORM
            </div>
          </motion.div>

          {/* ── SLIDER ── */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div
              style={{
                flex: 1,
                background: C.bg2,
                border: `1px solid ${C.border2}`,
                borderRadius: 14,
                position: 'relative',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeSlide}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.42, ease: [0.65, 0, 0.35, 1] }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    padding: '30px 32px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* slide decorative circle */}
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    style={{
                      position: 'absolute',
                      right: 24,
                      top: 20,
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: SLIDES[activeSlide].accent,
                      filter: 'blur(30px)',
                      pointerEvents: 'none',
                    }}
                  />

                  <div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        color: C.text3,
                        letterSpacing: '1px',
                        marginBottom: 14,
                      }}
                    >
                      {SLIDES[activeSlide].num}
                    </div>

                    <div
                      style={{
                        display: 'inline-block',
                        background: 'rgba(196,168,130,0.1)',
                        border: '1px solid rgba(196,168,130,0.22)',
                        color: C.accent2,
                        fontSize: 10,
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        letterSpacing: '1.2px',
                        textTransform: 'uppercase',
                        borderRadius: 4,
                        padding: '3px 10px',
                        marginBottom: 14,
                      }}
                    >
                      {SLIDES[activeSlide].chip}
                    </div>

                    <motion.h3
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 }}
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: 26,
                        letterSpacing: '-0.5px',
                        lineHeight: 1.18,
                        whiteSpace: 'pre-line',
                        marginBottom: 10,
                      }}
                    >
                      {SLIDES[activeSlide].title}
                    </motion.h3>

                    <p
                      style={{
                        fontSize: 12.5,
                        color: C.accent2,
                        fontStyle: 'italic',
                        marginBottom: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      {SLIDES[activeSlide].subtitle}
                    </p>

                    <p style={{ fontSize: 13.5, color: C.text2, lineHeight: 1.7 }}>
                      {SLIDES[activeSlide].body}
                    </p>
                  </div>

                  {/* tags or stats */}
                  {SLIDES[activeSlide].tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
                      {SLIDES[activeSlide].tags.map((tag, i) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + i * 0.04 }}
                          style={{
                            background: C.bg4,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            padding: '4px 12px',
                            fontSize: 11,
                            color: C.text2,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                  )}

                  {SLIDES[activeSlide].stats.length > 0 && (
                    <div style={{ display: 'flex', gap: 28, marginTop: 18 }}>
                      {SLIDES[activeSlide].stats.map(({ val, lbl }, i) => (
                        <motion.div
                          key={lbl}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.12 + i * 0.06 }}
                        >
                          <div
                            style={{
                              fontFamily: "'Syne', sans-serif",
                              fontWeight: 800,
                              fontSize: 22,
                              color: C.text,
                            }}
                          >
                            {val}
                          </div>
                          <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{lbl}</div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* slider controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {SLIDES.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => goTo(i)}
                    animate={{ width: i === activeSlide ? 24 : 7 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      height: 7,
                      borderRadius: 4,
                      border: 'none',
                      background: i === activeSlide
                        ? 'linear-gradient(90deg, #c4a882, #b8956a)'
                        : C.border2,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {(['←', '→'] as const).map((arrow, i) => (
                  <motion.button
                    key={arrow}
                    whileHover={{ scale: 1.1, borderColor: C.accent }}
                    whileTap={{ scale: 0.92 }}
                    onClick={i === 0 ? prev : next}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      border: `1px solid ${C.border2}`,
                      background: C.bg3,
                      color: C.text2,
                      fontSize: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {arrow}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* ── SERVICES STRIP ── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 8,
              marginTop: 18,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {SERVICES.map(({ icon, name, desc }) => (
              <motion.div
                key={name}
                whileHover={{ borderColor: C.border2, background: C.bg3, y: -2 }}
                style={{
                  background: C.bg2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '12px 10px',
                  cursor: 'default',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 6 }}>{icon}</div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: C.text2,
                  }}
                >
                  {name}
                </div>
                <div style={{ fontSize: 9.5, color: C.text3, marginTop: 2, lineHeight: 1.35 }}>
                  {desc}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── SCROLLING TICKER ── */}
          <div
            style={{
              marginTop: 14,
              overflow: 'hidden',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 32,
                animation: 'nexusTicker 22s linear infinite',
                width: 'max-content',
              }}
            >
              {[...Array(2)].flatMap(() =>
                ['Web Dev', 'Mobile Apps', 'UI/UX Design', 'ERP Systems', 'AI Integration', 'Cloud Hosting', 'FinTech', 'EdTech', 'HealthTech', 'SaaS Products', 'DevOps', 'Analytics'].map((item) => (
                  <span
                    key={item + Math.random()}
                    style={{
                      fontSize: 11,
                      color: C.text3,
                      fontFamily: "'JetBrains Mono', monospace",
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {item}
                    <span style={{ marginLeft: 32, color: C.border2 }}>◆</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT  10% — PRODUCT DOCK
        ══════════════════════════════════════════ */}
        <div
          style={{
            width: '10%',
            minWidth: 72,
            background: C.bg2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '36px 0',
            gap: 10,
            position: 'relative',
            zIndex: 10,
            overflow: 'visible',
          }}
        >
          {/* vertical label */}
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.8px',
              color: C.text3,
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              marginBottom: 8,
            }}
          >
            Products
          </div>

          {PRODUCTS.map((prod, i) => (
            <motion.div
              key={prod.id}
              ref={(el: HTMLDivElement | null) => { btnRefs.current[prod.id] = el; }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
              onMouseEnter={() => handleProdEnter(prod.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              whileHover={{ scale: 1.1, x: -4 }}
              whileTap={{ scale: 0.93 }}
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: hoveredProduct === prod.id ? 'rgba(196,168,130,0.08)' : C.bg3,
                border: `1px solid ${hoveredProduct === prod.id ? C.accent : C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 21,
                cursor: 'pointer',
                boxShadow: hoveredProduct === prod.id ? '0 4px 20px rgba(196,168,130,0.15)' : 'none',
                transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {prod.icon}
            </motion.div>
          ))}

          {/* bottom divider + external link */}
          <div style={{ flex: 1 }} />
          <a
            href="https://aethersolve.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            title="AetherSolve.com"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: C.bg3,
              border: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: C.text3,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            ↗
          </a>
        </div>

        {/* ══════════════════════════════════════════
            HOVER PRODUCT PANEL (portal-like, fixed)
        ══════════════════════════════════════════ */}
        <AnimatePresence>
          {hoveredProduct && activeProductData && (
            <ProductPanel product={activeProductData} anchorY={panelY} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
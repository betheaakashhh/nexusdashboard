'use client';
// src/app/dashboard/email/page.tsx
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmails } from '@/hooks/useEmails';
import { useSettings } from '@/hooks/useSettings';
import { Email } from '@/types';
import Modal from '@/components/ui/Modal';
import { FormField, Input, Textarea, Btn } from '@/components/ui/FormField';

const TABS = [
  { key: 'inbox',   label: 'Inbox'   },
  { key: 'sent',    label: 'Sent'    },
  { key: 'starred', label: 'Starred' },
] as const;

function timeAgo(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString();
  } catch { return dateStr; }
}

// ── Quick recipient picker ────────────────────────────────────────────────────
function RecipientInput({
  value, onChange, quickRecipients,
}: {
  value: string;
  onChange: (v: string) => void;
  quickRecipients: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = quickRecipients.filter(
    (r) => !value || r.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Input
          type="email"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="recipient@email.com"
        />
        {quickRecipients.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', padding: '4px', display: 'flex', alignItems: 'center',
            }}
            title="Show saved recipients"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg2)', border: '1px solid var(--border2)',
              borderRadius: 'var(--r2)', zIndex: 200,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              overflow: 'hidden', marginTop: 4,
            }}
          >
            <div style={{ padding: '6px 10px 4px', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'var(--font-syne)', fontWeight: 700 }}>
              Quick Recipients
            </div>
            {filtered.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { onChange(r); setOpen(false); }}
                style={{
                  width: '100%', padding: '9px 12px', background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  color: 'var(--text)', fontSize: '13px', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--accent2)" strokeWidth="1.5">
                  <rect x="2" y="4" width="12" height="9" rx="2"/><path d="M2 7l6 4 6-4"/>
                </svg>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r}</span>
                <span style={{ fontSize: '10px', color: 'var(--text3)' }}>↵</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EmailPage() {
  const {
    emails, selected, loading, tab, query,
    setTab, setQuery, setSelected,
    fetchEmails, sendEmail, markRead, toggleStar, deleteEmail, importFile,
  } = useEmails();

  const { settings } = useSettings();

  const [composeOpen,      setComposeOpen]       = useState(false);
  const [composeForm,      setComposeForm]        = useState({ to: '', subject: '', body: '' });
  const [replyTo,          setReplyTo]            = useState<Email | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen]  = useState(false);
  const [sending,          setSending]            = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEmails(); }, []);

  const displayed = emails.filter((e) => {
    if (!query) return true;
    return (
      e.sender.toLowerCase().includes(query.toLowerCase()) ||
      e.subject.toLowerCase().includes(query.toLowerCase())
    );
  });

  async function handleSelect(e: Email) {
    setSelected(e);
    if (e.unread) markRead(e.id);
    setMobileDetailOpen(true);
  }

  function openReply(e: Email) {
    setReplyTo(e);
    // Append signature if set
    const sig = settings.emailSignature ? `\n\n--\n${settings.emailSignature}` : '';
    setComposeForm({ to: e.senderEmail, subject: `Re: ${e.subject}`, body: sig });
    setComposeOpen(true);
  }

  function openCompose() {
    setReplyTo(null);
    const sig = settings.emailSignature ? `\n\n--\n${settings.emailSignature}` : '';
    setComposeForm({ to: '', subject: '', body: sig });
    setComposeOpen(true);
  }

  async function handleSend() {
    if (!composeForm.to || !composeForm.subject) return;
    setSending(true);
    try {
      await sendEmail({
        to: composeForm.to,
        subject: composeForm.subject,
        body: composeForm.body,
      });
      setComposeOpen(false);
      setComposeForm({ to: '', subject: '', body: '' });
    } finally {
      setSending(false);
    }
  }

  function handleImport(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (file) { importFile(file); ev.target.value = ''; }
  }

  function closeMobileDetail() {
    setMobileDetailOpen(false);
    setSelected(null);
  }

  const unreadCount = emails.filter(e => e.tab === 'inbox' && e.unread).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* Topbar */}
      <div style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px',
        flexShrink: 0, height: 'var(--topbar-height)',
      }}>
        <div className="topbar-title" style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          Email
          {unreadCount > 0 && (
            <span style={{ background: 'var(--accent3)', color: 'var(--accent2)', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div className="topbar-search" style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '8px 12px 8px 30px', color: 'var(--text)', fontSize: '13px', outline: 'none' }} />
        </div>
        <label className="topbar-import-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: 'var(--r2)', background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M4 6l4-4 4 4"/><path d="M2 12h12v2H2z"/></svg>
          CSV
          <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <Btn variant="primary" onClick={openCompose} style={{ flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L6 9M13 2H8M13 2v5"/><path d="M11 4H3a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1V8"/></svg>
          <span className="compose-label">Compose</span>
        </Btn>
      </div>

      {/* Content */}
      <div className="email-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* List panel */}
        <div className="email-list-panel" style={{
          width: '320px', minWidth: '320px',
          background: 'var(--bg2)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                flex: 1, padding: '11px', textAlign: 'center', fontSize: '12px', cursor: 'pointer',
                color: tab === t.key ? 'var(--accent2)' : 'var(--text3)',
                borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
                background: 'transparent', border: 'none',
                fontFamily: 'var(--font-syne)', fontWeight: 600, transition: 'all 0.15s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Email list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>Loading…</div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.3, display: 'block', margin: '0 auto 10px' }}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/></svg>
                No emails
              </div>
            ) : displayed.map((e) => (
              <motion.div
                key={e.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelect(e)}
                className="email-list-item"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px',
                  borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  borderLeft: `3px solid ${selected?.id === e.id ? 'var(--accent)' : 'transparent'}`,
                  background: selected?.id === e.id ? 'var(--bg4)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: e.unread ? 'var(--accent)' : 'transparent', flexShrink: 0, marginTop: '5px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <div style={{ fontSize: '13px', fontWeight: e.unread ? 600 : 400, color: e.unread ? 'var(--text)' : 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>{e.sender}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text3)', flexShrink: 0 }}>{e.sentAt || timeAgo(e.createdAt)}</div>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{e.subject}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text3)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.preview}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop detail panel */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="email-desktop-detail" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <EmailDetail email={selected} onReply={() => openReply(selected)} onStar={() => toggleStar(selected.id)} onDelete={() => deleteEmail(selected.id)} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="email-desktop-detail" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/></svg>
              </div>
              <div style={{ fontSize: '13px' }}>Select an email to read</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile full-screen detail overlay */}
      <AnimatePresence>
        {mobileDetailOpen && selected && (
          <motion.div
            key="mobile-detail"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="email-mobile-detail"
            style={{ display: 'none', position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 45, overflowY: 'auto', paddingBottom: 'var(--mobile-nav-height)' }}
          >
            <div style={{ position: 'sticky', top: 0, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
              <button onClick={closeMobileDetail} style={{ width: '36px', height: '36px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 12L6 8l4-4"/></svg>
              </button>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.subject}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{selected.sender}</div>
              </div>
              <button onClick={() => toggleStar(selected.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: selected.starred ? 'var(--amber)' : 'var(--text3)', padding: '4px' }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill={selected.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M8 1l1.9 4.1 4.1.3-3 2.8.9 4.1L8 10.2 4.1 12.3l.9-4.1-3-2.8 4.1-.3z"/></svg>
              </button>
            </div>
            <div style={{ padding: '20px 16px' }}>
              <EmailDetail email={selected} onReply={() => openReply(selected)} onStar={() => toggleStar(selected.id)} onDelete={() => { deleteEmail(selected.id); closeMobileDetail(); }} isMobile />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose Modal */}
      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title={replyTo ? `Reply to ${replyTo.sender}` : 'New Email'}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSend} disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </Btn>
          </>
        }
      >
        <FormField label="To">
          <RecipientInput
            value={composeForm.to}
            onChange={(v) => setComposeForm({ ...composeForm, to: v })}
            quickRecipients={settings.quickRecipients}
          />
        </FormField>
        {settings.quickRecipients.length > 0 && (
          <div style={{ marginTop: -8, marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', color: 'var(--text3)', alignSelf: 'center' }}>Quick:</span>
            {settings.quickRecipients.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setComposeForm({ ...composeForm, to: r })}
                style={{
                  fontSize: '11px', padding: '3px 9px', borderRadius: 20,
                  border: `1px solid ${composeForm.to === r ? 'var(--accent)' : 'var(--border)'}`,
                  background: composeForm.to === r ? 'var(--accent3)' : 'transparent',
                  color: composeForm.to === r ? 'var(--accent2)' : 'var(--text2)',
                  cursor: 'pointer', transition: 'all 0.12s',
                  maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        )}
        <FormField label="Subject">
          <Input value={composeForm.subject} onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })} placeholder="Email subject" />
        </FormField>
        <FormField label="Message">
          <Textarea value={composeForm.body} onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })} placeholder="Write your message…" style={{ minHeight: '140px' }} />
        </FormField>
        {settings.defaultFromEmail && (
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5h.01"/></svg>
            Sending from: {settings.defaultFromEmail}
          </div>
        )}
      </Modal>

      <style>{`
        @media (max-width: 768px) {
          .email-list-panel { width: 100% !important; min-width: unset !important; border-right: none !important; }
          .email-desktop-detail { display: none !important; }
          .email-mobile-detail { display: block !important; }
          .compose-label { display: none; }
        }
      `}</style>
    </div>
  );
}

// ── Email detail subcomponent ─────────────────────────────────────────────────
function EmailDetail({ email, onReply, onStar, onDelete, isMobile = false }: {
  email: Email; onReply: () => void; onStar: () => void; onDelete: () => void; isMobile?: boolean;
}) {
  return (
    <div>
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px', flex: 1 }}>{email.subject}</div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <Btn size="sm" variant="ghost" onClick={onReply}>Reply</Btn>
            <Btn size="sm" variant="ghost" onClick={onStar}>{email.starred ? 'Unstar' : 'Star'}</Btn>
            <Btn size="sm" variant="danger" onClick={onDelete}>Delete</Btn>
          </div>
        </div>
      )}
      {isMobile && (
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', marginBottom: '16px' }}>{email.subject}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--r2)', marginBottom: '20px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--accent2)', fontFamily: 'var(--font-syne)', flexShrink: 0 }}>
          {email.sender[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>{email.sender}</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.senderEmail} · {email.sentAt || timeAgo(email.createdAt)}</div>
        </div>
      </div>
      <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text2)', whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
        {email.body}
      </div>
      {isMobile && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn variant="primary" onClick={onReply} style={{ flex: 1, justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4L2 8l4 4M2 8h8a4 4 0 010 8H8"/></svg>
            Reply
          </Btn>
          <Btn variant="danger" onClick={onDelete} style={{ justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M4 4l1 10h6l1-10"/></svg>
            Delete
          </Btn>
        </div>
      )}
    </div>
  );
}
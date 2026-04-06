'use client';
// src/app/dashboard/email/page.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmails } from '@/hooks/useEmails';
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
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  } catch { return dateStr; }
}

export default function EmailPage() {
  const { emails, selected, loading, tab, query,
    setTab, setQuery, setSelected,
    fetchEmails, sendEmail, markRead, toggleStar, deleteEmail, importFile } = useEmails();

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: '', subject: '', body: '' });
  const [replyTo, setReplyTo] = useState<Email | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEmails(); }, []);

  const displayed = emails.filter((e) => {
    if (!query) return true;
    return e.sender.toLowerCase().includes(query.toLowerCase()) ||
           e.subject.toLowerCase().includes(query.toLowerCase());
  });

  async function handleSelect(e: Email) {
    setSelected(e);
    if (e.unread) markRead(e.id);
  }

  function openReply(e: Email) {
    setReplyTo(e);
    setComposeForm({ to: e.senderEmail, subject: `Re: ${e.subject}`, body: '' });
    setComposeOpen(true);
  }

  function openCompose() {
    setReplyTo(null);
    setComposeForm({ to: '', subject: '', body: '' });
    setComposeOpen(true);
  }

  async function handleSend() {
    if (!composeForm.to || !composeForm.subject) return;
    await sendEmail(composeForm);
    setComposeOpen(false);
    setComposeForm({ to: '', subject: '', body: '' });
  }

  function handleImport(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (file) { importFile(file); ev.target.value = ''; }
  }

  const unreadCount = emails.filter(e => e.tab === 'inbox' && e.unread).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, flex: 1 }}>
          Email
          {unreadCount > 0 && (
            <span style={{ marginLeft: '8px', background: 'var(--accent3)', color: 'var(--accent2)', fontSize: '11px', padding: '1px 7px', borderRadius: '10px', fontWeight: 600 }}>
              {unreadCount} unread
            </span>
          )}
        </div>
        <div style={{ position: 'relative', maxWidth: '280px', flex: 1 }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search emails…"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '8px 12px 8px 32px', color: 'var(--text)', fontSize: '13px', outline: 'none' }} />
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: 'var(--r2)', background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M4 6l4-4 4 4"/><path d="M2 12h12v2H2z"/></svg>
          Import CSV
          <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <Btn variant="primary" onClick={openCompose}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>
          Compose
        </Btn>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* List panel */}
        <div style={{ width: '320px', minWidth: '320px', background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  flex: 1, padding: '11px', textAlign: 'center', fontSize: '12px', cursor: 'pointer',
                  color: tab === t.key ? 'var(--accent2)' : 'var(--text3)',
                  borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
                  background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
                  fontFamily: 'var(--font-syne)', fontWeight: 600, transition: 'all 0.15s',
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Email list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>Loading…</div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>No emails</div>
            ) : displayed.map((e) => (
              <motion.div key={e.id} whileHover={{ x: 2 }}
                onClick={() => handleSelect(e)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 12px',
                  borderBottom: '1px solid var(--border)', cursor: 'pointer', position: 'relative',
                  borderLeft: `2px solid ${selected?.id === e.id ? 'var(--accent)' : 'transparent'}`,
                  background: selected?.id === e.id ? 'var(--bg4)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: e.unread ? 'var(--accent)' : 'transparent', flexShrink: 0, marginTop: '6px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: e.unread ? 600 : 400, color: e.unread ? 'var(--text)' : 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.sender}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.subject}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text3)', marginTop: '2px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{e.preview}</div>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text3)', flexShrink: 0, marginTop: '2px' }}>
                  {e.sentAt || timeAgo(e.createdAt)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '16px' }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px', flex: 1 }}>{selected.subject}</div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <Btn size="sm" variant="ghost" onClick={() => openReply(selected)}>Reply</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => toggleStar(selected.id)}>
                    {selected.starred ? 'Unstar' : 'Star'}
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => deleteEmail(selected.id)}>Delete</Btn>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--r2)', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--accent2)', fontFamily: 'var(--font-syne)' }}>
                  {selected.sender[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{selected.sender}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{selected.senderEmail} &bull; {selected.sentAt || timeAgo(selected.createdAt)}</div>
                </div>
              </div>

              <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>
                {selected.body}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/></svg>
              </div>
              <div style={{ fontSize: '13px' }}>Select an email to read</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Compose Modal */}
      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title={replyTo ? `Reply to ${replyTo.sender}` : 'New Email'}
        footer={<><Btn variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleSend}>Send Email</Btn></>}>
        <FormField label="To"><Input type="email" value={composeForm.to} onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })} placeholder="recipient@email.com" /></FormField>
        <FormField label="Subject"><Input value={composeForm.subject} onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })} placeholder="Email subject" /></FormField>
        <FormField label="Message"><Textarea value={composeForm.body} onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })} placeholder="Write your message…" style={{ minHeight: '140px' }} /></FormField>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>Note: Connect an SMTP provider (e.g. Resend, Nodemailer) in the send API to deliver real emails.</div>
      </Modal>
    </div>
  );
}
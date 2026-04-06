'use client';
// src/app/dashboard/contacts/page.tsx
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContacts } from '@/hooks/useContacts';
import { useTasks } from '@/hooks/useTasks';
import { Contact, ContactTag, SortOption, Task } from '@/types';
import Modal from '@/components/ui/Modal';
import { FormField, Input, Textarea, Select, Btn } from '@/components/ui/FormField';

type ContactFormState = {
  name: string; phone: string; email: string;
  tag: Contact['tag']; notes: string;
};
type TaskFormState = {
  title: string; priority: Task['priority']; due: string;
};

const TAGS: { key: ContactTag; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'emergency', label: 'Emergency' },
  { key: 'family',    label: 'Family'    },
  { key: 'work',      label: 'Work'      },
  { key: 'personal',  label: 'Personal'  },
];
const SORTS: { key: SortOption; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'name',   label: 'A–Z'   },
  { key: 'added',  label: 'Added' },
];
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  emergency: { bg: 'rgba(255,77,106,0.15)',  color: 'var(--red)'    },
  family:    { bg: 'rgba(34,199,122,0.12)',   color: 'var(--green)'  },
  work:      { bg: 'rgba(77,159,255,0.12)',   color: 'var(--blue)'   },
  personal:  { bg: 'rgba(108,99,255,0.15)',   color: 'var(--accent2)'},
};

const AVATAR_COLORS = [
  ['#6c63ff','#1e1e3a'],['#22c77a','#0a2e1e'],['#ff4d6a','#2e0a10'],
  ['#4d9fff','#0a1e2e'],['#ffb547','#2e1e0a'],['#ff6b9d','#2e0a1e'],
  ['#5dd5d5','#0a2a2a'],['#a78bfa','#1e0a2e'],
];
function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}
function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
    .then(() => alert('Copied!'))
    .catch(() => console.error('Copy failed'));
}

const TAG_OPTS = [
  { value: 'personal',  label: 'Personal'  },
  { value: 'family',    label: 'Family'    },
  { value: 'work',      label: 'Work'      },
  { value: 'emergency', label: 'Emergency' },
];
const PRIORITY_OPTS = [
  { value: 'high', label: 'High'   },
  { value: 'med',  label: 'Medium' },
  { value: 'low',  label: 'Low'    },
];

export default function ContactsPage() {
  const { contacts, selected, loading, filter, sort, alpha, query,
    setFilter, setSort, setAlpha, setQuery, setSelected,
    fetchContacts, addContact, updateContact, deleteContact, importFile } = useContacts();
  const { tasks, addTask, toggleTask, deleteTask, fetchTasks } = useTasks();

  const [addOpen,  setAddOpen]  = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Mobile: whether we show inline detail below the tapped contact
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<ContactFormState>({ name: '', phone: '', email: '', tag: 'personal', notes: '' });
  const [editForm, setEditForm] = useState<ContactFormState>({ name: '', phone: '', email: '', tag: 'personal', notes: '' });
  const [taskForm, setTaskForm] = useState<TaskFormState>({ title: '', priority: 'med', due: '' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchContacts(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (selected) fetchTasks(selected.id); }, [selected]);

  const displayed = contacts.filter((c) => {
    if (alpha && !c.name.toUpperCase().startsWith(alpha)) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.phone.includes(query)) return false;
    return true;
  });

  const contactTasks = tasks.filter((t) => t.contactId === selected?.id);

  function openEdit(c: Contact) {
    setEditForm({ name: c.name, phone: c.phone, email: c.email || '', tag: c.tag, notes: c.notes || '' });
    setEditOpen(true);
  }

  function handleContactSelect(c: Contact) {
    const isActive = selected?.id === c.id;
    setSelected(isActive ? null : c);
    setMobileDetailOpen(!isActive);
    // Scroll to detail on mobile
    if (!isActive) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }

  async function handleAdd() {
    if (!form.name || !form.phone) return;
    await addContact(form);
    setAddOpen(false);
    setForm({ name: '', phone: '', email: '', tag: 'personal', notes: '' });
  }

  async function handleEdit() {
    if (!selected) return;
    await updateContact(selected.id, editForm);
    setEditOpen(false);
  }

  async function handleDelete() {
    if (!selected) return;
    await deleteContact(selected.id);
    setMobileDetailOpen(false);
  }

  async function handleAddTask() {
    if (!selected || !taskForm.title) return;
    await addTask({ ...taskForm, contactId: selected.id });
    await fetchTasks(selected.id);
    setTaskOpen(false);
    setTaskForm({ title: '', priority: 'med', due: '' });
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { importFile(file); e.target.value = ''; }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* Topbar */}
      <div style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
        height: 'var(--topbar-height)',
      }}>
        <div className="topbar-title" style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, flexShrink: 0 }}>Contacts</div>

        {/* Search */}
        <div className="topbar-search" style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); fetchContacts(); }}
            placeholder="Search…"
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '8px 12px 8px 30px', color: 'var(--text)', fontSize: '13px', outline: 'none' }}
          />
        </div>

        {/* Desktop: Import button */}
        <label className="topbar-import-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: 'var(--r2)', background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M4 6l4-4 4 4"/><path d="M2 12h12v2H2z"/></svg>
          Import
          <input type="file" accept=".vcf,.csv" onChange={handleImport} style={{ display: 'none' }} />
        </label>

        {/* Mobile: filter button */}
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          style={{
            display: 'none',
            width: '36px', height: '36px',
            borderRadius: 'var(--r2)',
            background: filterOpen ? 'var(--accent3)' : 'var(--bg3)',
            border: `1px solid ${filterOpen ? 'var(--accent)' : 'var(--border)'}`,
            color: filterOpen ? 'var(--accent2)' : 'var(--text2)',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          className="mobile-filter-btn"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M4 8h8M6 12h4"/></svg>
        </button>

        <Btn variant="primary" onClick={() => setAddOpen(true)} style={{ flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>
          <span className="btn-new-label">New</span>
        </Btn>
      </div>

      {/* Mobile filter dropdown */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: 'hidden',
              background: 'var(--bg2)',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
            className="mobile-filter-panel"
          >
            <div style={{ padding: '10px 16px' }}>
              {/* Filter chips */}
              <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-syne)', fontWeight: 600, marginBottom: '8px' }}>Filter</div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {TAGS.map((t) => (
                  <button key={t.key} onClick={() => setFilter(t.key)}
                    style={{
                      padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                      border: `1px solid ${filter === t.key ? (TAG_COLORS[t.key]?.color || 'var(--accent)') : 'var(--border)'}`,
                      background: filter === t.key ? (TAG_COLORS[t.key]?.bg || 'var(--accent3)') : 'transparent',
                      color: filter === t.key ? (TAG_COLORS[t.key]?.color || 'var(--accent2)') : 'var(--text2)',
                      fontWeight: 500,
                    }}
                  >{t.label}</button>
                ))}
              </div>

              {/* Sort */}
              <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-syne)', fontWeight: 600, marginBottom: '8px' }}>Sort</div>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                {SORTS.map((s) => (
                  <button key={s.key} onClick={() => setSort(s.key)}
                    style={{
                      fontSize: '12px', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                      border: `1px solid ${sort === s.key ? 'var(--border2)' : 'transparent'}`,
                      background: sort === s.key ? 'var(--bg4)' : 'transparent',
                      color: sort === s.key ? 'var(--text)' : 'var(--text3)',
                      fontWeight: sort === s.key ? 500 : 400,
                    }}
                  >{s.label}</button>
                ))}
              </div>

              {/* Alpha strip - compact on mobile */}
              <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-syne)', fontWeight: 600, marginBottom: '8px' }}>Alpha</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                <button onClick={() => setAlpha(null)}
                  style={{ padding: '3px 8px', borderRadius: '4px', border: 'none', background: alpha === null ? 'var(--accent3)' : 'transparent', color: alpha === null ? 'var(--accent2)' : 'var(--text3)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
                  All
                </button>
                {ALPHA.map((l) => (
                  <button key={l} onClick={() => setAlpha(alpha === l ? null : l)}
                    style={{ width: '26px', height: '24px', borderRadius: '4px', border: 'none', background: alpha === l ? 'var(--accent3)' : 'transparent', color: alpha === l ? 'var(--accent2)' : 'var(--text3)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="contacts-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── List panel ── */}
        <div
          className="contacts-list-panel"
          style={{
            width: '300px',
            minWidth: '300px',
            background: 'var(--bg2)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Stats — desktop only (hidden on mobile via CSS) */}
          <div className="contacts-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', padding: '12px 12px 0' }}>
            {[
              { label: 'Total',     val: contacts.length },
              { label: 'Emergency', val: contacts.filter(c => c.tag === 'emergency').length },
              { label: 'Family',    val: contacts.filter(c => c.tag === 'family').length },
            ].map((s) => (
              <div key={s.label} style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: '8px 10px', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: '18px', fontWeight: 800 }}>{s.val}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Desktop: Filter chips */}
          <div className="desktop-filters" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            {TAGS.map((t) => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
                  border: `1px solid ${filter === t.key ? (TAG_COLORS[t.key]?.color || 'var(--accent)') : 'var(--border)'}`,
                  background: filter === t.key ? (TAG_COLORS[t.key]?.bg || 'var(--accent3)') : 'transparent',
                  color: filter === t.key ? (TAG_COLORS[t.key]?.color || 'var(--accent2)') : 'var(--text2)',
                  fontWeight: 500, transition: 'all 0.15s',
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Desktop: Sort */}
          <div className="desktop-sort" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text3)', marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Sort</span>
            {SORTS.map((s) => (
              <button key={s.key} onClick={() => setSort(s.key)}
                style={{
                  fontSize: '11px', padding: '3px 8px', borderRadius: '20px', cursor: 'pointer',
                  border: `1px solid ${sort === s.key ? 'var(--border)' : 'transparent'}`,
                  background: sort === s.key ? 'var(--bg4)' : 'transparent',
                  color: sort === s.key ? 'var(--text)' : 'var(--text3)',
                  fontWeight: sort === s.key ? 500 : 400, transition: 'all 0.15s',
                }}
              >{s.label}</button>
            ))}
          </div>

          {/* Desktop: Alpha strip */}
          <div className="desktop-alpha" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setAlpha(null)}
              style={{ width: '22px', height: '20px', borderRadius: '3px', border: 'none', background: alpha === null ? 'var(--accent3)' : 'transparent', color: alpha === null ? 'var(--accent2)' : 'var(--text3)', fontSize: '10px', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
              All
            </button>
            {ALPHA.map((l) => (
              <button key={l} onClick={() => setAlpha(alpha === l ? null : l)}
                style={{ width: '20px', height: '20px', borderRadius: '3px', border: 'none', background: alpha === l ? 'var(--accent3)' : 'transparent', color: alpha === l ? 'var(--accent2)' : 'var(--text3)', fontSize: '10px', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600, transition: 'all 0.12s' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Contact list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>Loading…</div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>No contacts found</div>
            ) : (
              displayed.map((c) => {
                const [bg, clr] = avatarColor(c.name);
                const tc = TAG_COLORS[c.tag];
                const isActive = selected?.id === c.id;
                return (
                  <div key={c.id}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleContactSelect(c)}
                      className="contact-list-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        borderRadius: 'var(--r2)',
                        cursor: 'pointer',
                        marginBottom: '2px',
                        transition: 'all 0.15s',
                        background: isActive ? 'var(--bg4)' : 'transparent',
                        border: `1px solid ${isActive ? 'var(--border2)' : 'transparent'}`,
                      }}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: bg, color: clr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-syne)', flexShrink: 0 }}>
                        {initials(c.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text2)', marginTop: '1px' }}>{c.phone}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', fontFamily: 'var(--font-syne)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', background: tc?.bg, color: tc?.color }}>
                          {c.tag}
                        </span>
                        {/* Mobile chevron */}
                        <span className="mobile-chevron" style={{ display: 'none', color: 'var(--text3)', transition: 'transform 0.2s', transform: isActive ? 'rotate(180deg)' : 'none' }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l4 4 4-4"/></svg>
                        </span>
                      </div>
                    </motion.div>

                    {/* ── Mobile inline mini detail ── */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          ref={detailRef}
                          key={`inline-${c.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                          className="contact-inline-detail"
                          style={{
                            display: 'none', /* shown via CSS on mobile */
                            overflow: 'hidden',
                            marginBottom: '4px',
                          }}
                        >
                          <div style={{
                            background: 'var(--bg3)',
                            borderRadius: 'var(--r2)',
                            margin: '0 4px 4px',
                            border: `1px solid var(--border2)`,
                            overflow: 'hidden',
                          }}>
                            {/* Mini contact info */}
                            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-syne)' }}>{c.name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>{c.phone}</div>
                                {c.email && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px' }}>{c.email}</div>}
                              </div>
                              {/* Call / message quick actions */}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <a href={`tel:${c.phone}`} style={{
                                  width: '36px', height: '36px', borderRadius: '50%',
                                  background: 'rgba(34,199,122,0.15)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'var(--green)', textDecoration: 'none',
                                }}>
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2.5a1 1 0 011-1h1.5a1 1 0 011 1v1a1 1 0 01-.293.707L5.5 5a8 8 0 004.5 4.5l.793-.707A1 1 0 0111.5 8.5h1a1 1 0 011 1V11a1 1 0 01-1 1C6.7 12 2 7.3 2 3a1 1 0 011-1z"/></svg>
                                </a>
                                <a href={`sms:${c.phone}`} style={{
                                  width: '36px', height: '36px', borderRadius: '50%',
                                  background: 'rgba(77,159,255,0.15)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'var(--blue)', textDecoration: 'none',
                                }}>
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 3V3a1 1 0 011-1z"/></svg>
                                </a>
                                <button
                                 onClick={() => copyToClipboard(c.phone)}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(108,99,255,0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--accent2)',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="5" y="5" width="8" height="8" rx="2"/>
                                        <rect x="3" y="3" width="8" height="8" rx="2"/>
                                      </svg>
                                    </button>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: '0', borderTop: '1px solid var(--border)' }}>
                              <button
                                onClick={() => openEdit(c)}
                                style={{
                                  flex: 1, padding: '10px', background: 'none', border: 'none',
                                  borderRight: '1px solid var(--border)',
                                  color: 'var(--text2)', cursor: 'pointer', fontSize: '12px',
                                  fontFamily: 'var(--font-syne)', fontWeight: 600,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.5 2.5l2 2-8 8H2v-1.5l8-8z"/><path d="M8 4l2 2"/></svg>
                                Edit
                              </button>
                              <button
                                onClick={() => setTaskOpen(true)}
                                style={{
                                  flex: 1, padding: '10px', background: 'none', border: 'none',
                                  borderRight: '1px solid var(--border)',
                                  color: 'var(--text2)', cursor: 'pointer', fontSize: '12px',
                                  fontFamily: 'var(--font-syne)', fontWeight: 600,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="10" height="10" rx="2"/><path d="M7 5v4M5 7h4"/></svg>
                                Task
                              </button>
                              <button
                                onClick={handleDelete}
                                style={{
                                  flex: 1, padding: '10px', background: 'none', border: 'none',
                                  color: 'var(--red)', cursor: 'pointer', fontSize: '12px',
                                  fontFamily: 'var(--font-syne)', fontWeight: 600,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4M3 4l1 8h6l1-8"/></svg>
                                Delete
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Desktop Detail panel ── */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="contacts-detail-panel"
              style={{ flex: 1, overflowY: 'auto' }}
            >
              <ContactDetail
                contact={selected}
                tasks={contactTasks}
                onEdit={() => openEdit(selected)}
                onDelete={handleDelete}
                onAddTask={() => setTaskOpen(true)}
                onToggleTask={async (id, done) => { await toggleTask(id, done); fetchTasks(selected.id); }}
                onDeleteTask={async (id) => { await deleteTask(id); fetchTasks(selected.id); }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="contacts-detail-panel"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text3)' }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8"/></svg>
              </div>
              <div style={{ fontSize: '13px' }}>Select a contact to view details</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Contact"
        footer={<><Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleAdd}>Save Contact</Btn></>}>
        <FormField label="Full Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" /></FormField>
        <FormField label="Phone Number *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" /></FormField>
        <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" /></FormField>
        <FormField label="Tag"><Select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value as Contact['tag'] })} options={TAG_OPTS} /></FormField>
        <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes…" /></FormField>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Contact"
        footer={<><Btn variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleEdit}>Update</Btn></>}>
        <FormField label="Full Name"><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></FormField>
        <FormField label="Phone Number"><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></FormField>
        <FormField label="Email"><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></FormField>
        <FormField label="Tag"><Select value={editForm.tag} onChange={(e) => setEditForm({ ...editForm, tag: e.target.value as Contact['tag'] })} options={TAG_OPTS} /></FormField>
        <FormField label="Notes"><Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></FormField>
      </Modal>

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title={`Add Task for ${selected?.name || ''}`}
        footer={<><Btn variant="ghost" onClick={() => setTaskOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleAddTask}>Add Task</Btn></>}>
        <FormField label="Task Title *"><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="What needs to be done?" /></FormField>
        <FormField label="Priority"><Select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })} options={PRIORITY_OPTS} /></FormField>
        <FormField label="Due Date"><Input type="date" value={taskForm.due} onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })} /></FormField>
      </Modal>

      {/* Mobile-specific CSS */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-filter-btn { display: inline-flex !important; }
          .contacts-stats { display: none !important; }
          .desktop-filters { display: none !important; }
          .desktop-sort { display: none !important; }
          .desktop-alpha { display: none !important; }
          .contacts-detail-panel { display: none !important; }
          .contact-inline-detail { display: block !important; }
          .mobile-chevron { display: flex !important; }
          .btn-new-label { display: none; }
          .contacts-list-panel {
            border-right: none !important;
            width: 100% !important;
            min-width: unset !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Contact Detail (desktop only) ─────────────────────────────────────────────
function ContactDetail({ contact, tasks, onEdit, onDelete, onAddTask, onToggleTask, onDeleteTask }: {
  contact: Contact; tasks: Task[]; onEdit: () => void; onDelete: () => void;
  onAddTask: () => void; onToggleTask: (id: string, done: boolean) => void; onDeleteTask: (id: string) => void;
}) {
  const [bg, clr] = avatarColor(contact.name);
  const tc = TAG_COLORS[contact.tag];
  const PRIORITY_COLOR: Record<string, string> = { high: 'var(--red)', med: 'var(--amber)', low: 'var(--green)' };

  return (
    <div>
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: bg, color: clr, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-syne)', flexShrink: 0 }}>
          {initials(contact.name)}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>{contact.name}</div>
          <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '3px', fontFamily: 'var(--font-syne)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', background: tc?.bg, color: tc?.color }}>
            {contact.tag}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <Btn size="sm" variant="ghost" onClick={onEdit}>Edit</Btn>
          <Btn size="sm" variant="danger" onClick={onDelete}>Delete</Btn>
        </div>
      </div>

<div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
  <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'var(--font-syne)', fontWeight: 600, marginBottom: '10px' }}>Contact Info</div>
  {[
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="12" height="12" rx="2"/>
          <path d="M5 6.5c0 2.5 2 4.5 6 4.5V9l-2-1-1 1-2-1.5"/>
        </svg>
      ),
      label: 'Phone',
      val: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{contact.phone}</span>
          <button
            onClick={() => navigator.clipboard.writeText(contact.phone)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent2)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="5" width="8" height="8" rx="2"/>
              <rect x="3" y="3" width="8" height="8" rx="2"/>
            </svg>
          </button>
        </div>
      ),
    },
  ].map((item) => (
    <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ color: 'var(--text2)', marginTop: '2px' }}>{item.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
        <div style={{ fontSize: '13px', color: 'var(--text)' }}>{item.val}</div>
      </div>
    </div>
  ))}
</div>

      <div style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
            Linked Tasks ({tasks.length})
          </div>
          <Btn size="sm" variant="ghost" onClick={onAddTask}>+ Add Task</Btn>
        </div>
        {tasks.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: '12.5px' }}>No tasks linked.</div>
        ) : tasks.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIORITY_COLOR[t.priority], flexShrink: 0, marginTop: '5px' }} />
            <div onClick={() => onToggleTask(t.id, !t.done)} style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${t.done ? 'var(--green)' : 'var(--border2)'}`, background: t.done ? 'var(--green)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              {t.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><path d="M2 6l3 3 5-5"/></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--text3)' : 'var(--text)' }}>{t.title}</div>
              {t.due && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>Due: {t.due}</div>}
            </div>
            <button onClick={() => onDeleteTask(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
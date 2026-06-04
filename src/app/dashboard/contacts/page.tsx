'use client';
// src/app/dashboard/contacts/page.tsx

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse, { IFuseOptions } from 'fuse.js';
import { useContacts } from '@/hooks/useContacts';
import { useTasks } from '@/hooks/useTasks';
import { Contact, ContactTag, SortOption, Task } from '@/types';
import Modal from '@/components/ui/Modal';
import { FormField, Input, Textarea, Select, Btn } from '@/components/ui/FormField';

// ── Types ─────────────────────────────────────────────────────────────────────
type ContactFormState = {
  name: string; phone: string; email: string;
  tag: Contact['tag']; notes: string;
};
type TaskFormState = {
  title: string; priority: Task['priority']; due: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────
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

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  emergency: { bg: 'rgba(224,92,106,0.12)', text: '#e05c6a', border: 'rgba(224,92,106,0.3)'  },
  family:    { bg: 'rgba(77,184,138,0.12)', text: '#4db88a', border: 'rgba(77,184,138,0.3)'  },
  work:      { bg: 'rgba(106,163,216,0.12)',text: '#6aa3d8', border: 'rgba(106,163,216,0.3)' },
  personal:  { bg: 'rgba(201,169,110,0.12)',text: '#c9a96e', border: 'rgba(201,169,110,0.3)' },
};

// Warm avatar palette matching the dark theme
const AVATAR_PALETTE: Array<[string, string]> = [
  ['#c9a96e', '#3a3020'], // amber
  ['#4db88a', '#1a2e22'], // green
  ['#e05c6a', '#2e1418'], // red
  ['#6aa3d8', '#1a2430'], // blue
  ['#c97eaa', '#2e1a28'], // pink
  ['#e89a45', '#2e2010'], // orange
  ['#5dcaa5', '#1a2a26'], // teal
  ['#a78bfa', '#1e1830'], // lavender
];

function avatarColor(name: string): [string, string] {
  const i = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[i];
}
function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
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
const PRIORITY_COLOR: Record<string, string> = {
  high: '#e05c6a',
  med:  '#e89a45',
  low:  '#4db88a',
};

// ── Fuse.js config ────────────────────────────────────────────────────────────
// Weights: name is most important, then phone, then email, then notes
const FUSE_OPTIONS: IFuseOptions<Contact> = {
  keys: [
    { name: 'name',  weight: 0.5 },
    { name: 'phone', weight: 0.3 },
    { name: 'email', weight: 0.15 },
    { name: 'notes', weight: 0.05 },
  ],
  threshold:    0.35,   // 0 = exact, 1 = match anything — 0.35 is comfortably typo-tolerant
  distance:     200,    // How far into the string to look
  includeScore: true,
  minMatchCharLength: 1,
  ignoreLocation: true, // Don't penalise matches at end of string
};

// ── Small UI atoms ────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const [fg, bg] = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700,
      fontFamily: 'var(--font-syne)', flexShrink: 0,
      border: `1.5px solid ${fg}33`,
    }}>
      {initials(name)}
    </div>
  );
}

function TagPill({ tag, size = 'sm' }: { tag: string; size?: 'xs' | 'sm' }) {
  const c = TAG_COLORS[tag];
  if (!c) return null;
  return (
    <span style={{
      fontSize: size === 'xs' ? '9px' : '10px',
      padding: size === 'xs' ? '1px 5px' : '2px 7px',
      borderRadius: '4px',
      fontFamily: 'var(--font-syne)',
      fontWeight: 700,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      flexShrink: 0,
    }}>
      {tag}
    </span>
  );
}

function IconBtn({
  onClick, title, children, danger = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30,
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'transparent',
        color: danger ? 'var(--red)' : 'var(--text3)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? 'rgba(224,92,106,0.1)' : 'var(--bg6)';
        e.currentTarget.style.borderColor = danger ? 'var(--red)' : 'var(--border2)';
        e.currentTarget.style.color = danger ? 'var(--red)' : 'var(--text)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.color = danger ? 'var(--red)' : 'var(--text3)';
      }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '9px', color: 'var(--text3)',
      textTransform: 'uppercase', letterSpacing: '1px',
      fontFamily: 'var(--font-syne)', fontWeight: 700,
      marginBottom: '8px',
    }}>
      {children}
    </div>
  );
}

// ── Copy helper ───────────────────────────────────────────────────────────────
function useCopyFlash() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  }, []);
  return { copied, copy };
}

// ── Highlight matched text ────────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  try {
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(re);
    return (
      <>
        {parts.map((p, i) =>
          re.test(p)
            ? <mark key={i} style={{ background: 'rgba(201,169,110,0.25)', color: '#c9a96e', borderRadius: 2, padding: '0 1px' }}>{p}</mark>
            : p
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ContactsPage() {
  const {
    contacts, selected, loading, filter, sort, alpha, query,
    setFilter, setSort, setAlpha, setQuery, setSelected,
    fetchContacts, addContact, updateContact, deleteContact, importFile,
  } = useContacts();

  const { tasks, addTask, toggleTask, deleteTask, fetchTasks } = useTasks();

  const [addOpen,    setAddOpen]    = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [taskOpen,   setTaskOpen]   = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');

  const detailRef  = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);

  const [form, setForm]         = useState<ContactFormState>({ name: '', phone: '', email: '', tag: 'personal', notes: '' });
  const [editForm, setEditForm] = useState<ContactFormState>({ name: '', phone: '', email: '', tag: 'personal', notes: '' });
  const [taskForm, setTaskForm] = useState<TaskFormState>({ title: '', priority: 'med', due: '' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchContacts(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (selected) fetchTasks(selected.id); }, [selected]);

  // ── Fuse instance rebuilt only when contacts change ───────────────────────
  const fuse = useMemo(() => new Fuse(contacts, FUSE_OPTIONS), [contacts]);

  // ── Fuzzy search + filter + alpha ─────────────────────────────────────────
  const displayed = useMemo(() => {
    let base: Contact[];

    if (localQuery.trim().length >= 1) {
      base = fuse.search(localQuery.trim()).map((r) => r.item);
    } else {
      base = contacts;
    }

    // tag filter
    if (filter && filter !== 'all') {
      base = base.filter((c) => c.tag === filter);
    }
    // alpha filter
    if (alpha) {
      base = base.filter((c) => c.name.toUpperCase().startsWith(alpha));
    }

    return base;
  }, [contacts, fuse, localQuery, filter, alpha]);

  const contactTasks = tasks.filter((t) => t.contactId === selected?.id);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function handleQueryChange(val: string) {
    setLocalQuery(val);
    setQuery(val); // keep hook in sync for server-side if used
  }

  function openEdit(c: Contact) {
    setEditForm({ name: c.name, phone: c.phone, email: c.email || '', tag: c.tag, notes: c.notes || '' });
    setEditOpen(true);
  }

  function handleContactSelect(c: Contact) {
    const isActive = selected?.id === c.id;
    setSelected(isActive ? null : c);
    if (!isActive) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
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

  // Stats
  const stats = useMemo(() => ({
    total:     contacts.length,
    emergency: contacts.filter(c => c.tag === 'emergency').length,
    family:    contacts.filter(c => c.tag === 'family').length,
    work:      contacts.filter(c => c.tag === 'work').length,
  }), [contacts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* ── Topbar ── */}
      <div style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
        height: 'var(--topbar-height)',
      }}>
        <div
          className="topbar-title"
          style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 700, flexShrink: 0, color: 'var(--text)' }}
        >
          Contacts
        </div>

        {/* Search with keyboard hint */}
        <div className="topbar-search" style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
          <i className="fi fi-rr-search" aria-hidden="true" style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text3)', fontSize: 14, pointerEvents: 'none',
          }} />
          <input
            ref={searchRef}
            value={localQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search name, phone, email… (press /)"
            style={{
              width: '100%',
              background: 'var(--bg4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r2)',
              padding: '8px 36px 8px 32px',
              color: 'var(--text)',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
          {localQuery && (
            <button
              onClick={() => handleQueryChange('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text3)', display: 'flex', alignItems: 'center', padding: 2,
              }}
            >
              <i className="fi fi-rr-x" style={{ fontSize: 13 }} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Result count badge */}
        {localQuery && (
          <span style={{
            fontSize: '11px', color: 'var(--text3)',
            background: 'var(--bg4)', border: '1px solid var(--border)',
            padding: '3px 8px', borderRadius: 20, flexShrink: 0,
          }}>
            {displayed.length} found
          </span>
        )}

        {/* Import — desktop only */}
        <label
          className="topbar-import-btn"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 'var(--r2)',
            background: 'var(--bg4)', color: 'var(--text2)',
            border: '1px solid var(--border)', cursor: 'pointer',
            fontSize: '12px', fontWeight: 500, flexShrink: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
        >
          <i className="fi fi-rr-upload" aria-hidden="true" style={{ fontSize: 13 }} />
          Import
          <input type="file" accept=".vcf,.csv" onChange={handleImport} style={{ display: 'none' }} />
        </label>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="mobile-filter-btn"
          style={{
            display: 'none', width: 36, height: 36,
            borderRadius: 'var(--r2)',
            background: filterOpen ? '#3a3020' : 'var(--bg4)',
            border: `1px solid ${filterOpen ? '#4a3c28' : 'var(--border)'}`,
            color: filterOpen ? 'var(--accent)' : 'var(--text2)',
            cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <i className="fi fi-rr-filter" aria-hidden="true" style={{ fontSize: 16 }} />
        </button>

        <button
          onClick={() => setAddOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 'var(--r2)',
            background: '#3a3020', border: '1px solid #4a3c28',
            color: '#c9a96e', fontSize: '12px', fontWeight: 600,
            fontFamily: 'var(--font-syne)', cursor: 'pointer',
            flexShrink: 0, transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#4a3c28'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#3a3020'; }}
        >
          <i className="fi fi-rr-plus" aria-hidden="true" style={{ fontSize: 13 }} />
          <span className="btn-new-label">New</span>
        </button>
      </div>

      {/* ── Mobile filter panel ── */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}
          >
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <SectionLabel>Filter by tag</SectionLabel>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {TAGS.map((t) => {
                    const c = TAG_COLORS[t.key];
                    const isActive = filter === t.key;
                    return (
                      <button key={t.key} onClick={() => setFilter(t.key)} style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: '12px', cursor: 'pointer',
                        border: `1px solid ${isActive ? (c?.border || 'var(--accent)') : 'var(--border)'}`,
                        background: isActive ? (c?.bg || '#3a3020') : 'transparent',
                        color: isActive ? (c?.text || 'var(--accent)') : 'var(--text2)',
                        fontWeight: 500, transition: 'all 0.12s',
                      }}>{t.label}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <SectionLabel>Sort</SectionLabel>
                <div style={{ display: 'flex', gap: 5 }}>
                  {SORTS.map((s) => (
                    <button key={s.key} onClick={() => setSort(s.key)} style={{
                      fontSize: '12px', padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                      border: `1px solid ${sort === s.key ? 'var(--border2)' : 'transparent'}`,
                      background: sort === s.key ? 'var(--bg4)' : 'transparent',
                      color: sort === s.key ? 'var(--text)' : 'var(--text3)',
                      fontWeight: sort === s.key ? 500 : 400,
                    }}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Filter by letter</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <button onClick={() => setAlpha(null)} style={{
                    padding: '3px 8px', borderRadius: 4, border: 'none',
                    background: alpha === null ? '#3a3020' : 'transparent',
                    color: alpha === null ? '#c9a96e' : 'var(--text3)',
                    fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600,
                  }}>All</button>
                  {ALPHA.map((l) => (
                    <button key={l} onClick={() => setAlpha(alpha === l ? null : l)} style={{
                      width: 24, height: 22, borderRadius: 4, border: 'none',
                      background: alpha === l ? '#3a3020' : 'transparent',
                      color: alpha === l ? '#c9a96e' : 'var(--text3)',
                      fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600,
                    }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout ── */}
      <div className="contacts-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left panel: list ── */}
        <div
          className="contacts-list-panel"
          style={{
            width: 310, minWidth: 310,
            background: 'var(--bg2)',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Stats strip — desktop */}
          <div
            className="contacts-stats"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '12px 12px 10px' }}
          >
            {[
              { label: 'Total',  val: stats.total,     color: '#c9a96e' },
              { label: 'Family', val: stats.family,    color: '#4db88a' },
              { label: 'Work',   val: stats.work,      color: '#6aa3d8' },
              { label: 'Urgent', val: stats.emergency, color: '#e05c6a' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'var(--bg4)', borderRadius: 'var(--r2)',
                padding: '8px 10px', border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter chips — desktop */}
          <div className="desktop-filters" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '0 10px 8px', borderBottom: '1px solid var(--border)' }}>
            {TAGS.map((t) => {
              const c = TAG_COLORS[t.key];
              const isActive = filter === t.key;
              return (
                <button key={t.key} onClick={() => setFilter(t.key)} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: '11px', cursor: 'pointer',
                  border: `1px solid ${isActive ? (c?.border || 'var(--accent)') : 'var(--border)'}`,
                  background: isActive ? (c?.bg || '#3a3020') : 'transparent',
                  color: isActive ? (c?.text || 'var(--accent)') : 'var(--text2)',
                  fontWeight: 500, transition: 'all 0.12s',
                }}>{t.label}</button>
              );
            })}
          </div>

          {/* Sort + alpha — desktop */}
          <div className="desktop-sort" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginRight: 2 }}>Sort</span>
            {SORTS.map((s) => (
              <button key={s.key} onClick={() => setSort(s.key)} style={{
                fontSize: '11px', padding: '3px 8px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${sort === s.key ? 'var(--border2)' : 'transparent'}`,
                background: sort === s.key ? 'var(--bg4)' : 'transparent',
                color: sort === s.key ? 'var(--text)' : 'var(--text3)',
                fontWeight: sort === s.key ? 500 : 400, transition: 'all 0.12s',
              }}>{s.label}</button>
            ))}
          </div>

          {/* Alpha strip — desktop */}
          <div className="desktop-alpha" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setAlpha(null)} style={{
              padding: '2px 6px', borderRadius: 3, border: 'none',
              background: alpha === null ? '#3a3020' : 'transparent',
              color: alpha === null ? '#c9a96e' : 'var(--text3)',
              fontSize: '9px', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 700,
            }}>All</button>
            {ALPHA.map((l) => (
              <button key={l} onClick={() => setAlpha(alpha === l ? null : l)} style={{
                width: 18, height: 18, borderRadius: 3, border: 'none',
                background: alpha === l ? '#3a3020' : 'transparent',
                color: alpha === l ? '#c9a96e' : 'var(--text3)',
                fontSize: '9px', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 700,
                transition: 'all 0.1s',
              }}>{l}</button>
            ))}
          </div>

          {/* Contact list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>
                <i className="fi fi-rr-loader" style={{ fontSize: 20, display: 'block', margin: '0 auto 8px', animation: 'spin 0.8s linear infinite' }} aria-hidden="true" />
                Loading contacts…
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>
                <i className="fi fi-rr-user-search" style={{ fontSize: 32, display: 'block', margin: '0 auto 10px', opacity: 0.4 }} aria-hidden="true" />
                <div style={{ fontSize: '13px', marginBottom: 4 }}>
                  {localQuery ? `No results for "${localQuery}"` : 'No contacts found'}
                </div>
                {localQuery && (
                  <div style={{ fontSize: '11px', color: 'var(--text3)', opacity: 0.7 }}>
                    Try a different spelling or check the filter
                  </div>
                )}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {displayed.map((c, idx) => {
                  const isActive = selected?.id === c.id;
                  return (
                    <div key={c.id}>
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.1) }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => handleContactSelect(c)}
                        className="contact-list-item"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 10px', borderRadius: 'var(--r2)',
                          cursor: 'pointer', marginBottom: 2,
                          background: isActive ? 'var(--bg4)' : 'transparent',
                          border: `1px solid ${isActive ? 'var(--border2)' : 'transparent'}`,
                          transition: 'all 0.12s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'var(--bg3)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <div style={{
                            position: 'absolute', left: 0, top: 6, bottom: 6,
                            width: 3, borderRadius: '0 3px 3px 0', background: '#c9a96e',
                          }} />
                        )}

                        <Avatar name={c.name} size={38} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13.5px', fontWeight: 500, color: 'var(--text)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            <Highlight text={c.name} query={localQuery} />
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text2)', marginTop: 1 }}>
                            <Highlight text={c.phone} query={localQuery} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <TagPill tag={c.tag} size="xs" />
                          {/* Mobile chevron */}
                          <span
                            className="mobile-chevron"
                            style={{
                              display: 'none', color: 'var(--text3)',
                              transition: 'transform 0.2s',
                              transform: isActive ? 'rotate(180deg)' : 'none',
                            }}
                          >
                            <i className="fi fi-rr-chevron-down" style={{ fontSize: 12 }} aria-hidden="true" />
                          </span>
                        </div>
                      </motion.div>

                      {/* Mobile inline detail */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            ref={detailRef}
                            key={`inline-${c.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                            className="contact-inline-detail"
                            style={{ display: 'none', overflow: 'hidden', marginBottom: 4 }}
                          >
                            <MobileInlineDetail
                              contact={c}
                              onEdit={() => openEdit(c)}
                              onDelete={handleDelete}
                              onTask={() => setTaskOpen(true)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* ── Right panel: detail ── */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="contacts-detail-panel"
              style={{ flex: 1, overflowY: 'auto', background: 'var(--bg5)' }}
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
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 16, color: 'var(--text3)',
                background: 'var(--bg5)',
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--bg4)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="fi fi-rr-address-book" style={{ fontSize: 28, color: 'var(--text3)' }} aria-hidden="true" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: 4 }}>Select a contact</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Click any contact to view details</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', opacity: 0.6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <kbd style={{
                  background: 'var(--bg4)', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '1px 6px', fontSize: '11px',
                  color: 'var(--text3)',
                }}>/</kbd>
                to search
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modals ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Contact"
        footer={<><Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleAdd}>Save Contact</Btn></>}>
        <FormField label="Full Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ranjan Kumar" /></FormField>
        <FormField label="Phone Number *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" /></FormField>
        <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ranjan@example.com" /></FormField>
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

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title={`Add Task — ${selected?.name || ''}`}
        footer={<><Btn variant="ghost" onClick={() => setTaskOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={handleAddTask}>Add Task</Btn></>}>
        <FormField label="Task Title *"><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="What needs to be done?" /></FormField>
        <FormField label="Priority"><Select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })} options={PRIORITY_OPTS} /></FormField>
        <FormField label="Due Date"><Input type="date" value={taskForm.due} onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })} /></FormField>
      </Modal>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 768px) {
          .mobile-filter-btn  { display: inline-flex !important; }
          .contacts-stats     { display: none !important; }
          .desktop-filters    { display: none !important; }
          .desktop-sort       { display: none !important; }
          .desktop-alpha      { display: none !important; }
          .contacts-detail-panel { display: none !important; }
          .contact-inline-detail { display: block !important; }
          .mobile-chevron     { display: flex !important; }
          .btn-new-label      { display: none; }
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

// ── Mobile Inline Detail ──────────────────────────────────────────────────────
function MobileInlineDetail({
  contact, onEdit, onDelete, onTask,
}: {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  onTask: () => void;
}) {
  const { copied, copy } = useCopyFlash();

  return (
    <div style={{
      background: 'var(--bg3)', borderRadius: 'var(--r2)',
      margin: '0 4px 4px', border: '1px solid var(--border2)', overflow: 'hidden',
    }}>
      {/* Contact info row */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
        <Avatar name={contact.name} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>{contact.name}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: 2 }}>{contact.phone}</div>
          {contact.email && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: 1 }}>{contact.email}</div>}
        </div>
        {/* Quick action circles */}
        <div style={{ display: 'flex', gap: 6 }}>
          <a href={`tel:${contact.phone}`} title="Call" style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(77,184,138,0.15)', border: '1px solid rgba(77,184,138,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#4db88a', textDecoration: 'none',
          }}>
            <i className="fi fi-rr-phone-call" aria-hidden="true" style={{ fontSize: 15 }} />
          </a>
          <a href={`sms:${contact.phone}`} title="Message" style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(106,163,216,0.15)', border: '1px solid rgba(106,163,216,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6aa3d8', textDecoration: 'none',
          }}>
            <i className="fi fi-rr-envelope" aria-hidden="true" style={{ fontSize: 15 }} />
          </a>
          <button onClick={() => copy(contact.phone, 'phone')} title="Copy number" style={{
            width: 36, height: 36, borderRadius: '50%',
            background: copied === 'phone' ? 'rgba(77,184,138,0.15)' : 'rgba(201,169,110,0.15)',
            border: `1px solid ${copied === 'phone' ? 'rgba(77,184,138,0.3)' : 'rgba(201,169,110,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: copied === 'phone' ? '#4db88a' : '#c9a96e', cursor: 'pointer',
          }}>
            <i className={`fi ${copied === 'phone' ? 'fi-rr-check' : 'fi-rr-copy'}`} aria-hidden="true" style={{ fontSize: 14 }} />
          </button>
        </div>
      </div>

      {/* Action strip */}
      <div style={{ display: 'flex' }}>
        {[
          { label: 'Edit', icon: 'fi-rr-edit', fn: onEdit, danger: false },
          { label: 'Task', icon: 'fi-rr-checkbox', fn: onTask, danger: false },
          { label: 'Delete', icon: 'fi-rr-trash', fn: onDelete, danger: true },
        ].map((a, i, arr) => (
          <button key={a.label} onClick={a.fn} style={{
            flex: 1, padding: '10px 0', background: 'none',
            border: 'none', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            color: a.danger ? 'var(--red)' : 'var(--text2)',
            cursor: 'pointer', fontSize: '12px',
            fontFamily: 'var(--font-syne)', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <i className={`fi ${a.icon}`} aria-hidden="true" style={{ fontSize: 13 }} />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Desktop Contact Detail ────────────────────────────────────────────────────
function ContactDetail({
  contact, tasks, onEdit, onDelete, onAddTask, onToggleTask, onDeleteTask,
}: {
  contact: Contact; tasks: Task[];
  onEdit: () => void; onDelete: () => void; onAddTask: () => void;
  onToggleTask: (id: string, done: boolean) => void;
  onDeleteTask: (id: string) => void;
}) {
  const { copied, copy } = useCopyFlash();
  const tc = TAG_COLORS[contact.tag];
  const pending   = tasks.filter(t => !t.done);
  const completed = tasks.filter(t =>  t.done);

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '24px 24px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Avatar name={contact.name} size={60} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-syne)', fontSize: '22px',
              fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text)',
              marginBottom: 6,
            }}>
              {contact.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <TagPill tag={contact.tag} />
              {contact.email && (
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{contact.email}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={onEdit} style={{
              padding: '7px 14px', borderRadius: 'var(--r2)',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text2)', fontSize: '12px', fontWeight: 600,
              fontFamily: 'var(--font-syne)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
            >
              <i className="fi fi-rr-edit" aria-hidden="true" style={{ fontSize: 13 }} />
              Edit
            </button>
            <button onClick={onDelete} style={{
              padding: '7px 14px', borderRadius: 'var(--r2)',
              background: 'rgba(224,92,106,0.08)', border: '1px solid rgba(224,92,106,0.25)',
              color: '#e05c6a', fontSize: '12px', fontWeight: 600,
              fontFamily: 'var(--font-syne)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(224,92,106,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(224,92,106,0.08)'; }}
            >
              <i className="fi fi-rr-trash" aria-hidden="true" style={{ fontSize: 13 }} />
              Delete
            </button>
          </div>
        </div>

        {/* Quick action bar */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <a href={`tel:${contact.phone}`} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 'var(--r2)',
            background: 'rgba(77,184,138,0.1)', border: '1px solid rgba(77,184,138,0.25)',
            color: '#4db88a', textDecoration: 'none', fontSize: '12px', fontWeight: 600,
            fontFamily: 'var(--font-syne)',
          }}>
            <i className="fi fi-rr-phone" aria-hidden="true" style={{ fontSize: 14 }} />
            Call
          </a>
          <a href={`sms:${contact.phone}`} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 'var(--r2)',
            background: 'rgba(106,163,216,0.1)', border: '1px solid rgba(106,163,216,0.25)',
            color: '#6aa3d8', textDecoration: 'none', fontSize: '12px', fontWeight: 600,
            fontFamily: 'var(--font-syne)',
          }}>
            <i className="fi fi-rr-message" aria-hidden="true" style={{ fontSize: 14 }} />
            Message
          </a>
          <button onClick={() => copy(contact.phone, 'phone')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 'var(--r2)',
            background: copied === 'phone' ? 'rgba(77,184,138,0.1)' : 'var(--bg4)',
            border: `1px solid ${copied === 'phone' ? 'rgba(77,184,138,0.25)' : 'var(--border)'}`,
            color: copied === 'phone' ? '#4db88a' : 'var(--text2)',
            fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-syne)', cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            <i className={`fi ${copied === 'phone' ? 'fi-rr-check' : 'fi-rr-copy'}`} aria-hidden="true" style={{ fontSize: 13 }} />
            {copied === 'phone' ? 'Copied!' : contact.phone}
          </button>
        </div>
      </div>

      {/* Contact info fields */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase',
          letterSpacing: '1.2px', fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: 14,
        }}>
          Contact info
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: 'fi-rr-phone',    label: 'Phone', value: contact.phone,        copyKey: 'phone2' },
            ...(contact.email ? [{ icon: 'fi-rr-mail', label: 'Email', value: contact.email, copyKey: 'email' }] : []),
            ...(contact.notes ? [{ icon: 'fi-rr-notes', label: 'Notes', value: contact.notes, copyKey: '' }] : []),
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--r2)',
                background: 'var(--bg4)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className={`fi ${row.icon}`} aria-hidden="true" style={{ fontSize: 14, color: 'var(--text3)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.5 }}>{row.value}</div>
              </div>
              {row.copyKey && (
                <button
                  onClick={() => copy(row.value, row.copyKey)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: copied === row.copyKey ? '#4db88a' : 'var(--text3)',
                    display: 'flex', alignItems: 'center', padding: 4, transition: 'color 0.15s',
                  }}
                  title="Copy"
                >
                  <i className={`fi ${copied === row.copyKey ? 'fi-rr-check' : 'fi-rr-copy'}`} aria-hidden="true" style={{ fontSize: 14 }} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Linked tasks */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase',
              letterSpacing: '1.2px', fontFamily: 'var(--font-syne)', fontWeight: 700,
            }}>
              Linked Tasks
            </div>
            {tasks.length > 0 && (
              <span style={{
                fontSize: '10px', background: '#3a3020', color: '#c9a96e',
                border: '1px solid #4a3c28', padding: '1px 7px', borderRadius: 10, fontWeight: 600,
              }}>
                {pending.length} pending
              </span>
            )}
          </div>
          <button onClick={onAddTask} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 'var(--r2)',
            background: '#3a3020', border: '1px solid #4a3c28',
            color: '#c9a96e', fontSize: '11px', fontWeight: 600,
            fontFamily: 'var(--font-syne)', cursor: 'pointer', transition: 'all 0.12s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#4a3c28'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#3a3020'; }}
          >
            <i className="fi fi-rr-plus" aria-hidden="true" style={{ fontSize: 12 }} />
            Add Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div style={{
            padding: '20px', borderRadius: 'var(--r2)',
            border: '1px dashed var(--border)', textAlign: 'center',
            color: 'var(--text3)', fontSize: '12px',
          }}>
            No linked tasks yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pending.map((t) => <TaskRow key={t.id} task={t} onToggle={onToggleTask} onDelete={onDeleteTask} />)}
            {completed.length > 0 && (
              <>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 8, marginBottom: 2, fontFamily: 'var(--font-syne)', fontWeight: 700 }}>
                  Completed
                </div>
                {completed.map((t) => <TaskRow key={t.id} task={t} onToggle={onToggleTask} onDelete={onDeleteTask} />)}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task row ─────────────────────────────────────────────────────────────────
function TaskRow({
  task, onToggle, onDelete,
}: {
  task: Task;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 'var(--r2)',
      background: 'var(--bg4)', border: '1px solid var(--border)',
      transition: 'border-color 0.12s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* Priority dot */}
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: PRIORITY_COLOR[task.priority],
      }} />

      {/* Checkbox */}
      <motion.div
        whileTap={{ scale: 0.8 }}
        onClick={() => onToggle(task.id, !task.done)}
        style={{
          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
          border: `1.5px solid ${task.done ? '#4db88a' : 'var(--border2)'}`,
          background: task.done ? '#4db88a' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s',
        }}
      >
        {task.done && <i className="fi fi-rr-check" aria-hidden="true" style={{ fontSize: 11, color: '#1a2e22' }} />}
      </motion.div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px', color: task.done ? 'var(--text3)' : 'var(--text)',
          textDecoration: task.done ? 'line-through' : 'none',
        }}>
          {task.title}
        </div>
        {task.due && (
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
            <i className="fi fi-rr-calendar" aria-hidden="true" style={{ fontSize: 11 }} />
            {task.due}
          </div>
        )}
      </div>

      {/* Priority badge */}
      <span style={{
        fontSize: '9px', padding: '2px 6px', borderRadius: 3,
        background: `${PRIORITY_COLOR[task.priority]}18`,
        color: PRIORITY_COLOR[task.priority],
        fontFamily: 'var(--font-syne)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0,
      }}>
        {task.priority}
      </span>

      <IconBtn onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} title="Delete task" danger>
        <i className="fi fi-rr-x" aria-hidden="true" style={{ fontSize: 12 }} />
      </IconBtn>
    </div>
  );
}
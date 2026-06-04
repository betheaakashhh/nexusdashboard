'use client';
// src/components/layout/Sidebar.tsx
// Email and Settings nav items expand downward as accordion sub-menus.

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmails } from '@/hooks/useEmails';
import { useSettings, SettingsSection } from '@/hooks/useSettings';

type ExpandedMenu = 'email' | 'settings' | null;

// ── Simple (non-accordion) nav items ─────────────────────────────────────────
const SIMPLE_NAV = [
  {
    href: '/dashboard/contacts',
    label: 'Contacts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/tasks',
    label: 'Tasks',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/private',
    label: 'Private Vault',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
        <circle cx="12" cy="16" r="1.5"/>
      </svg>
    ),
  },
];

// ── Email sub-tabs ────────────────────────────────────────────────────────────
const EMAIL_SUBS = [
  {
    key: 'inbox' as const,
    label: 'Inbox',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/>
      </svg>
    ),
  },
  {
    key: 'sent' as const,
    label: 'Sent',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
      </svg>
    ),
  },
  {
    key: 'starred' as const,
    label: 'Starred',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
] as const;

// ── Settings sub-sections ─────────────────────────────────────────────────────
const SETTINGS_SUBS: { key: SettingsSection; label: string; icon: React.ReactNode }[] = [
  {
    key: 'appearance',
    label: 'Appearance',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8a4 4 0 000 8M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>
    ),
  },
  {
    key: 'security',
    label: 'Security',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/>
      </svg>
    ),
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8"/>
      </svg>
    ),
  },
  {
    key: 'data',
    label: 'Data',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
        <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/>
      </svg>
    ),
  },
];

// ── Mobile bottom nav ─────────────────────────────────────────────────────────
const MOBILE_NAV = [
  {
    href: '/dashboard/contacts',
    label: 'Contacts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/tasks',
    label: 'Tasks',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/email',
    label: 'Email',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/private',
    label: 'Vault',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
        <circle cx="12" cy="16" r="1.5"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    ),
  },
];

// ── Chevron icon ──────────────────────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      style={{
        marginLeft: 'auto',
        flexShrink: 0,
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.22s ease',
      }}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

// ── Active dot ────────────────────────────────────────────────────────────────
function ActiveDot() {
  return (
    <span
      style={{
        marginLeft: 'auto',
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: 'var(--accent)',
        flexShrink: 0,
      }}
    />
  );
}

// ── Main Sidebar component ────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { tab: emailTab, setTab: setEmailTab } = useEmails();
  const { activeSection, setActiveSection } = useSettings();

  const [expandedMenu, setExpandedMenu] = useState<ExpandedMenu>(null);

  const isOnEmail    = pathname.startsWith('/dashboard/email');
  const isOnSettings = pathname.startsWith('/dashboard/settings');

  // Auto-expand accordion when the user lands on email or settings page
  useEffect(() => {
    if (isOnEmail)    setExpandedMenu('email');
    if (isOnSettings) setExpandedMenu('settings');
  }, [isOnEmail, isOnSettings]);

  // ── Email accordion handlers ──────────────────────────────────────────────
  function handleEmailHeaderClick() {
    if (isOnEmail) {
      // Don't allow collapsing while on email page — tabs would be unreachable
      return;
    }
    const willOpen = expandedMenu !== 'email';
    setExpandedMenu(willOpen ? 'email' : null);
    if (willOpen) router.push('/dashboard/email');
  }

  function handleEmailTabClick(tab: 'inbox' | 'sent' | 'starred') {
    setEmailTab(tab);
    if (!isOnEmail) router.push('/dashboard/email');
  }

  // ── Settings accordion handlers ───────────────────────────────────────────
  function handleSettingsHeaderClick() {
    if (isOnSettings) {
      // Don't allow collapsing while on settings page
      return;
    }
    const willOpen = expandedMenu !== 'settings';
    setExpandedMenu(willOpen ? 'settings' : null);
    if (willOpen) router.push('/dashboard/settings');
  }

  function handleSettingsSectionClick(section: SettingsSection) {
    setActiveSection(section);
    if (!isOnSettings) router.push('/dashboard/settings');
  }

  const emailOpen    = expandedMenu === 'email';
  const settingsOpen = expandedMenu === 'settings';

  // ── Shared style helpers ──────────────────────────────────────────────────
  const navBtn = (isActive: boolean): React.CSSProperties => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 10px',
    borderRadius: 'var(--r2)',
    marginBottom: '2px',
    border: `1px solid ${isActive ? 'rgba(201,169,110,0.2)' : 'transparent'}`,
    cursor: 'pointer',
    background: isActive ? 'var(--accent3)' : 'transparent',
    color: isActive ? 'var(--accent2)' : 'var(--text2)',
    fontFamily: 'var(--font-syne)',
    fontWeight: 600,
    fontSize: '13px',
    transition: 'all 0.15s',
    textAlign: 'left' as const,
  });

  const subBtn = (isActive: boolean): React.CSSProperties => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 10px',
    borderRadius: 'var(--r2)',
    marginBottom: '1px',
    border: 'none',
    cursor: 'pointer',
    background: isActive ? 'rgba(201,169,110,0.12)' : 'transparent',
    color: isActive ? 'var(--accent2)' : 'var(--text3)',
    fontSize: '12px',
    fontFamily: 'var(--font-syne)',
    fontWeight: isActive ? 600 : 400,
    transition: 'all 0.15s',
    textAlign: 'left' as const,
  });

  const iconColor = (isActive: boolean) =>
    ({ color: isActive ? 'var(--accent2)' : 'var(--text3)', flexShrink: 0 });

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="desktop-sidebar"
        style={{
          width: '220px',
          minWidth: '220px',
          background: 'var(--bg2)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: '22px',
            letterSpacing: '-0.8px',
            background: 'linear-gradient(135deg, #8b7fff, #ff6b9d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Nexus
          </div>
          {user && (
            <div style={{
              fontSize: '11px',
              color: 'var(--text3)',
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user.name}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* ── Simple nav links (no accordion) ── */}
          {SIMPLE_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Collapse both accordions when going to a non-accordion page
                  setExpandedMenu(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: 'var(--r2)',
                  marginBottom: '2px',
                  textDecoration: 'none',
                  color: active ? 'var(--accent2)' : 'var(--text2)',
                  background: active ? 'var(--accent3)' : 'transparent',
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 600,
                  fontSize: '13px',
                  transition: 'all 0.15s',
                  border: `1px solid ${active ? 'rgba(201,169,110,0.2)' : 'transparent'}`,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg3)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={iconColor(active)}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {/* ── Email accordion ── */}
          <div style={{ marginBottom: '2px' }}>
            {/* Header */}
            <button
              onClick={handleEmailHeaderClick}
              style={navBtn(isOnEmail)}
              onMouseEnter={(e) => { if (!isOnEmail) e.currentTarget.style.background = 'var(--bg3)'; }}
              onMouseLeave={(e) => { if (!isOnEmail) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={iconColor(isOnEmail)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/>
                </svg>
              </span>
              Email
              <Chevron open={emailOpen} />
            </button>

            {/* Sub-items */}
            {emailOpen && (
              <div
                className="sidebar-submenu"
                style={{
                  marginLeft: '12px',
                  paddingLeft: '10px',
                  borderLeft: '1px solid var(--border)',
                  paddingTop: '2px',
                  paddingBottom: '4px',
                  marginBottom: '2px',
                }}
              >
                {EMAIL_SUBS.map((sub) => {
                  const isActive = isOnEmail && emailTab === sub.key;
                  return (
                    <button
                      key={sub.key}
                      onClick={() => handleEmailTabClick(sub.key)}
                      style={subBtn(isActive)}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--bg3)';
                          e.currentTarget.style.color = 'var(--text2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text3)';
                        }
                      }}
                    >
                      <span style={{ opacity: 0.75, flexShrink: 0 }}>{sub.icon}</span>
                      {sub.label}
                      {isActive && <ActiveDot />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Settings accordion ── */}
          <div style={{ marginBottom: '2px' }}>
            {/* Header */}
            <button
              onClick={handleSettingsHeaderClick}
              style={navBtn(isOnSettings)}
              onMouseEnter={(e) => { if (!isOnSettings) e.currentTarget.style.background = 'var(--bg3)'; }}
              onMouseLeave={(e) => { if (!isOnSettings) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={iconColor(isOnSettings)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41"/>
                </svg>
              </span>
              Settings
              <Chevron open={settingsOpen} />
            </button>

            {/* Sub-items */}
            {settingsOpen && (
              <div
                className="sidebar-submenu"
                style={{
                  marginLeft: '12px',
                  paddingLeft: '10px',
                  borderLeft: '1px solid var(--border)',
                  paddingTop: '2px',
                  paddingBottom: '4px',
                  marginBottom: '2px',
                }}
              >
                {SETTINGS_SUBS.map((sub) => {
                  const isActive = isOnSettings && activeSection === sub.key;
                  return (
                    <button
                      key={sub.key}
                      onClick={() => handleSettingsSectionClick(sub.key)}
                      style={subBtn(isActive)}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--bg3)';
                          e.currentTarget.style.color = 'var(--text2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text3)';
                        }
                      }}
                    >
                      <span style={{ opacity: 0.75, flexShrink: 0 }}>{sub.icon}</span>
                      {sub.label}
                      {isActive && <ActiveDot />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </nav>

        {/* User info / settings shortcut at bottom */}
        {user && (
          <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => {
                setExpandedMenu('settings');
                setActiveSection('appearance');
                router.push('/dashboard/settings');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: 'var(--r2)',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--accent3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent2)',
                fontFamily: 'var(--font-syne)',
                flexShrink: 0,
              }}>
                {user.name[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user.name}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text3)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user.email}
                </div>
              </div>
              <svg
                width="13" height="13"
                viewBox="0 0 24 24" fill="none"
                stroke="var(--text3)" strokeWidth="1.5"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41"/>
              </svg>
            </button>
          </div>
        )}
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="mobile-nav">
        {MOBILE_NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '6px 8px',
                borderRadius: 'var(--r2)',
                textDecoration: 'none',
                color: active ? 'var(--accent2)' : 'var(--text3)',
                fontSize: '9px',
                fontFamily: 'var(--font-syne)',
                fontWeight: 600,
                flex: 1,
                background: active ? 'var(--accent3)' : 'transparent',
                transition: 'all 0.15s',
                minWidth: 0,
                textAlign: 'center',
              }}
            >
              {item.icon}
              <span style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        /* Accordion entrance animation */
        .sidebar-submenu {
          animation: submenuSlide 0.18s ease forwards;
        }
        @keyframes submenuSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </>
  );
}
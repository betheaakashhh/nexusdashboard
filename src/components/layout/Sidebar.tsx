'use client';
// src/components/layout/Sidebar.tsx
// Updated to include Private Vault nav item

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const NAV = [
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
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/email',
    label: 'Email',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/>
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
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar" style={{
        width: '220px',
        minWidth: '220px',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
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
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
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
                  border: `1px solid ${active ? 'var(--accent3)' : 'transparent'}`,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg3)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: active ? 'var(--accent2)' : 'var(--text3)' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        {user && (
          <div style={{
            padding: '12px 10px',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: 'var(--r2)',
              marginBottom: '6px',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
            }}>
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
                <div style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '7px 10px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r2)',
                color: 'var(--text3)',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-syne)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12h3a1 1 0 001-1V5a1 1 0 00-1-1h-3M7 9l3-3-3-3M10 6H3"/>
              </svg>
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Nav */}
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
    </>
  );
}
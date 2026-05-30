'use client';
// src/components/layout/Sidebar.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const NAV_MAIN = [
  {
    href: '/dashboard/contacts',
    label: 'Contacts',
    icon: 'ti-address-book',
  },
  {
    href: '/dashboard/tasks',
    label: 'Tasks',
    icon: 'ti-checkbox',
  },
  {
    href: '/dashboard/email',
    label: 'Email',
    icon: 'ti-mail',
  },
];

const NAV_SECURE = [
  {
    href: '/dashboard/private',
    label: 'Private Vault',
    icon: 'ti-lock',
  },
];

const MOBILE_NAV = [
  { href: '/dashboard/contacts', label: 'Contacts', icon: 'ti-address-book' },
  { href: '/dashboard/tasks',    label: 'Tasks',    icon: 'ti-checkbox'     },
  { href: '/dashboard/email',    label: 'Email',    icon: 'ti-mail'         },
  { href: '/dashboard/private',  label: 'Vault',    icon: 'ti-lock'         },
];

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 10px',
        borderRadius: 'var(--r2)',
        marginBottom: '2px',
        textDecoration: 'none',
        fontSize: '13px',
        fontFamily: 'var(--font-syne)',
        fontWeight: 600,
        transition: 'all 0.15s',
        color:      active ? '#d4b97e'  : 'var(--text2)',
        background: active ? '#3a3020'  : 'transparent',
        border:     active ? '1px solid #4a3c28' : '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg4)';
          e.currentTarget.style.color = 'var(--text)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text2)';
        }
      }}
    >
      <i
        className={`ti ${icon}`}
        aria-hidden="true"
        style={{
          fontSize: '18px',
          color: active ? '#c9a96e' : 'var(--text3)',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
      />
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '9px',
        color: 'var(--text3)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-syne)',
        fontWeight: 700,
        padding: '14px 10px 6px',
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: '1px',
        background: 'var(--border)',
        margin: '6px 10px',
      }}
    />
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

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
        <div
          style={{
            padding: '20px 18px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 800,
              fontSize: '22px',
              letterSpacing: '-0.8px',
              color: 'var(--accent)',
            }}
          >
            Nexus
          </div>
          {user && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text3)',
                marginTop: '3px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }}>
          <SectionLabel>Workspace</SectionLabel>

          {NAV_MAIN.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname.startsWith(item.href)}
            />
          ))}

          <Divider />
          <SectionLabel>Secure</SectionLabel>

          {NAV_SECURE.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </nav>

        {/* User + Logout */}
        {user && (
          <div
            style={{
              padding: '12px 10px',
              borderTop: '1px solid var(--border)',
            }}
          >
            {/* User card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '9px 10px',
                borderRadius: 'var(--r2)',
                marginBottom: '6px',
                background: 'var(--bg4)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#3a3020',
                  border: '1.5px solid #4a3c28',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-syne)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text3)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.email}
                </div>
              </div>

              {/* Settings icon */}
              <i
                className="ti ti-settings"
                aria-hidden="true"
                style={{ fontSize: '14px', color: 'var(--text3)', flexShrink: 0 }}
              />
            </div>

            {/* Logout */}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--red)';
                e.currentTarget.style.color = 'var(--red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text3)';
              }}
            >
              <i className="ti ti-logout" aria-hidden="true" style={{ fontSize: '13px' }} />
              Logout
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
                justifyContent: 'center',
                gap: '3px',
                padding: '6px 8px',
                borderRadius: 'var(--r2)',
                textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text3)',
                fontSize: '9px',
                fontFamily: 'var(--font-syne)',
                fontWeight: 700,
                flex: 1,
                background: active ? '#3a3020' : 'transparent',
                transition: 'all 0.15s',
                minWidth: 0,
                textAlign: 'center',
              }}
            >
              <i
                className={`ti ${item.icon}`}
                aria-hidden="true"
                style={{ fontSize: '20px' }}
              />
              <span style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
            </Link>
          );
        })}

        {user && (
          <button
            type="button"
            onClick={logout}
            aria-label="Logout"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 8px',
              borderRadius: 'var(--r2)',
              color: 'var(--text3)',
              fontSize: '9px',
              fontFamily: 'var(--font-syne)',
              fontWeight: 700,
              flex: 1,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onTouchStart={(e) => { e.currentTarget.style.color = 'var(--red)'; }}
            onTouchEnd={(e) => { e.currentTarget.style.color = 'var(--text3)'; }}
          >
            <i className="ti ti-logout" aria-hidden="true" style={{ fontSize: '20px' }} />
            <span style={{ lineHeight: 1 }}>Logout</span>
          </button>
        )}
      </nav>
    </>
  );
}
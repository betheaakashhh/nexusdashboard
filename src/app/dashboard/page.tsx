'use client';
// src/app/dashboard/page.tsx
// Reads defaultLanding from DB settings and redirects accordingly.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';

export default function DashboardPage() {
  const { settings, loaded } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (loaded) {
      const dest = `/dashboard/${settings.defaultLanding}`;
      router.replace(dest);
    }
  }, [loaded, settings.defaultLanding, router]);

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '13px', gap: '10px' }}>
      <span style={{ width: '16px', height: '16px', border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      Redirecting…
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
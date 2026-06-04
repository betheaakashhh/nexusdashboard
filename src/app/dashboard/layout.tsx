'use client';
// src/app/dashboard/layout.tsx
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, fetchMe, logout} = useAuth();
  const { fetchSettings, settings, loaded: settingsLoaded }: { fetchSettings: () => void; settings: { sessionTimeout?: number } | null; loaded: boolean } = useSettings();
  const router = useRouter();
  const fetched = useRef(false);
  const autoLogoutTimer = useRef<number | null>(null);
  const lastSessionTouch = useRef(0);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      fetchMe();
      fetchSettings();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    if (!user) return;

    const touchSession = () => {
      const now = Date.now();
      if (now - lastSessionTouch.current < 60 * 1000) return;
      lastSessionTouch.current = now;
      fetchMe();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'visibilitychange'];
    activityEvents.forEach((event) => window.addEventListener(event, touchSession, { passive: true }));

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, touchSession));
    };
  }, [fetchMe, user]);

  useEffect(() => {
    const sessionTimeout = settings?.sessionTimeout ?? 0;
    if (!user || !settingsLoaded || sessionTimeout === 0) {
      if (autoLogoutTimer.current) window.clearTimeout(autoLogoutTimer.current);
      return;
    }

    const timeoutMs = sessionTimeout * 60 * 1000;
    const resetTimer = () => {
      if (autoLogoutTimer.current) window.clearTimeout(autoLogoutTimer.current);
      autoLogoutTimer.current = window.setTimeout(() => {
        logout();
      }, timeoutMs);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'visibilitychange'];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (autoLogoutTimer.current) window.clearTimeout(autoLogoutTimer.current);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [logout, settings?.sessionTimeout, settingsLoaded, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text3)', fontSize: '13px' }}>
        <span style={{ width: '18px', height: '18px', border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
        Loading Nexus…
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar />
      <main
        className="dashboard-main"
        style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </main>
    </div>
  );
}
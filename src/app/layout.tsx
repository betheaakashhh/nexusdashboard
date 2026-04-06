// src/app/layout.tsx
import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
});

export const metadata: Metadata = {
  title: 'Nexus — Personal Dashboard',
  description: 'Your private personal dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e1e28',
              color: '#e8e8f0',
              border: '1px solid #3a3a4a',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#22c77a', secondary: '#1e1e28' } },
            error:   { iconTheme: { primary: '#ff4d6a', secondary: '#1e1e28' } },
          }}
        />
      </body>
    </html>
  );
}

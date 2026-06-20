// src/app/layout.tsx
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import {Syne, DM_Sans} from 'next/font/google';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Xprivate+ — Access your data from anywhere',
  description: 'Your private personal dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn-uicons.flaticon.com/uicons-regular-rounded/css/uicons-regular-rounded.css"
        />
      </head>
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

// src/app/page.tsx
import { redirect } from 'next/navigation';

// The middleware handles auth — if the cookie exists it lets /dashboard through,
// if not it redirects to /login. This root page just always goes to /dashboard
// and lets middleware decide whether to allow it or send back to /login.
export default function RootPage() {
  redirect('/dashboard/contacts');
}
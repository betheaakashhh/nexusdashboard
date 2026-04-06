# Nexus — Personal Dashboard

A private personal dashboard with contact management, email manager, and task tracker. Built with Next.js 15, Supabase (PostgreSQL), Prisma, Framer Motion, and TypeScript. Single deployment on Vercel — no separate backend needed.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Next.js 15 (App Router)             |
| Language   | TypeScript                          |
| Styling    | Tailwind CSS + CSS Variables        |
| Animation  | Framer Motion + GSAP                |
| Database   | PostgreSQL via Supabase             |
| ORM        | Prisma                              |
| Auth       | JWT (HttpOnly cookies) + bcrypt     |
| State      | Zustand                             |
| Deployment | Vercel (frontend + API routes)      |

---

## Project Structure

```
nexus-dashboard/
├── prisma/
│   ├── schema.prisma          ← DB models: User, Contact, Task, Email
│   └── seed.ts                ← Creates admin + sample data
├── src/
│   ├── middleware.ts           ← Protects all routes, redirects to /login
│   ├── types/index.ts          ← Shared TypeScript interfaces
│   ├── lib/
│   │   ├── prisma.ts           ← Prisma client singleton
│   │   ├── auth.ts             ← JWT sign/verify, bcrypt, cookie helpers
│   │   └── vcf-parser.ts       ← VCF + CSV import parsers
│   ├── hooks/
│   │   ├── useAuth.ts          ← Zustand: user session
│   │   ├── useContacts.ts      ← Zustand: contacts CRUD + import
│   │   ├── useTasks.ts         ← Zustand: tasks CRUD
│   │   └── useEmails.ts        ← Zustand: emails CRUD + import
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx     ← Nav sidebar with user info + logout
│   │   └── ui/
│   │       ├── Modal.tsx       ← Animated modal wrapper
│   │       └── FormField.tsx   ← Input, Textarea, Select, Btn components
│   └── app/
│       ├── layout.tsx          ← Root layout (fonts, toast)
│       ├── globals.css         ← CSS variables + base styles
│       ├── page.tsx            ← Redirects to /dashboard or /login
│       ├── login/page.tsx      ← Login page
│       ├── api/
│       │   ├── auth/
│       │   │   ├── login/      ← POST: authenticate
│       │   │   ├── logout/     ← POST: clear cookie
│       │   │   ├── me/         ← GET: current user
│       │   │   └── setup/      ← POST: one-time admin creation
│       │   ├── contacts/
│       │   │   ├── route.ts    ← GET list, POST create
│       │   │   ├── [id]/       ← GET, PATCH, DELETE by id
│       │   │   └── import/     ← POST: VCF or CSV bulk import
│       │   ├── tasks/
│       │   │   ├── route.ts    ← GET list, POST create
│       │   │   └── [id]/       ← PATCH, DELETE by id
│       │   └── emails/
│       │       ├── route.ts    ← GET list, POST create
│       │       ├── [id]/       ← GET, PATCH, DELETE by id
│       │       └── import/     ← POST: CSV bulk import
│       └── dashboard/
│           ├── layout.tsx      ← Auth guard + sidebar wrapper
│           ├── page.tsx        ← Redirects to /dashboard/contacts
│           ├── contacts/       ← Full contacts page
│           ├── email/          ← Full email page
│           └── tasks/          ← Full tasks page
```

---

## Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to you, set a strong database password
3. Wait for the project to provision (~1 minute)
4. Go to **Project Settings → Database**
5. Scroll to **Connection string** section
6. Copy the **Transaction** mode URL (port `6543`) → this is your `DATABASE_URL`
7. Copy the **Session** mode URL (port `5432`) → this is your `DIRECT_URL`
8. Replace `[YOUR-PASSWORD]` in both URLs with your database password

### 2. Scaffold the Project

```bash
npx create-next-app@latest nexus-dashboard --typescript --tailwind --app --no-eslint
cd nexus-dashboard
```

### 3. Install Dependencies

```bash
npm install \
  @prisma/client \
  prisma \
  bcryptjs \
  jsonwebtoken \
  framer-motion \
  gsap \
  zustand \
  react-hot-toast \
  papaparse \
  clsx \
  @supabase/supabase-js

npm install -D \
  @types/bcryptjs \
  @types/jsonwebtoken \
  @types/papaparse \
  ts-node \
  autoprefixer
```

### 4. Copy All Source Files

Copy every file from this repository into its exact path inside your project.  
The files to copy are:

```
tsconfig.json
postcss.config.js
tailwind.config.ts
next.config.ts
vercel.json
package.json                       ← replace the auto-generated one
prisma/schema.prisma
prisma/seed.ts
src/middleware.ts
src/types/index.ts
src/lib/prisma.ts
src/lib/auth.ts
src/lib/vcf-parser.ts
src/hooks/useAuth.ts
src/hooks/useContacts.ts
src/hooks/useTasks.ts
src/hooks/useEmails.ts
src/components/layout/Sidebar.tsx
src/components/ui/Modal.tsx
src/components/ui/FormField.tsx
src/app/globals.css                ← replace auto-generated
src/app/layout.tsx                 ← replace auto-generated
src/app/page.tsx                   ← replace auto-generated
src/app/login/page.tsx
src/app/dashboard/layout.tsx
src/app/dashboard/page.tsx
src/app/dashboard/contacts/page.tsx
src/app/dashboard/email/page.tsx
src/app/dashboard/tasks/page.tsx
src/app/api/auth/login/route.ts
src/app/api/auth/logout/route.ts
src/app/api/auth/me/route.ts
src/app/api/auth/setup/route.ts
src/app/api/contacts/route.ts
src/app/api/contacts/[id]/route.ts
src/app/api/contacts/import/route.ts
src/app/api/tasks/route.ts
src/app/api/tasks/[id]/route.ts
src/app/api/emails/route.ts
src/app/api/emails/[id]/route.ts
src/app/api/emails/import/route.ts
```

### 5. Create Environment File

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
JWT_SECRET="your-64-char-random-string"
SETUP_SECRET="your-secret-phrase"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a secure JWT secret:
```bash
# macOS / Linux
openssl rand -base64 64

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

### 6. Push Database Schema

```bash
npx prisma db push
```

This creates the `User`, `Contact`, `Task`, and `Email` tables in your Supabase database. You can verify in **Supabase → Table Editor**.

### 7. Create Your Admin Account

**Option A — Via the setup API (recommended):**
```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-SETUP_SECRET-from-env",
    "email": "you@example.com",
    "password": "yourpassword",
    "name": "Your Name"
  }'
```

**Option B — Via the seed script:**
```bash
SEED_EMAIL=you@example.com SEED_PASSWORD=yourpassword SEED_NAME="Your Name" npm run db:seed
```
The seed also creates sample contacts, tasks, and emails so you can see the dashboard populated.

### 8. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/login`. Sign in with the credentials you created above.

---

## Deployment to Vercel

### Option A — CLI (fastest)

```bash
npm install -g vercel
vercel
```

Follow the prompts. When asked about framework, select **Next.js**.

### Option B — GitHub Integration

1. Push your project to a GitHub repo (make sure `.env.local` is in `.gitignore`)
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Vercel auto-detects Next.js

### Add Environment Variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Key                    | Value                          | Environments        |
|------------------------|--------------------------------|---------------------|
| `DATABASE_URL`         | Your Supabase transaction URL  | Production, Preview |
| `DIRECT_URL`           | Your Supabase session URL      | Production, Preview |
| `JWT_SECRET`           | Your 64-char random string     | Production, Preview |
| `SETUP_SECRET`         | Your setup passphrase          | Production, Preview |
| `NEXT_PUBLIC_APP_URL`  | Your Vercel URL                | Production          |

### Trigger Redeploy

```bash
vercel --prod
```

### Create Admin on Production

After deployment, call setup once:
```bash
curl -X POST https://your-app.vercel.app/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-SETUP_SECRET",
    "email": "you@example.com",
    "password": "yourpassword",
    "name": "Your Name"
  }'
```

---

## Importing Contacts

### VCF (from phone / Google Contacts)

**Export from Google Contacts:**
1. Go to [contacts.google.com](https://contacts.google.com)
2. Select contacts → More actions → Export → **vCard (for iOS Contacts)**
3. Click **Import** in Nexus → select the `.vcf` file

The importer reads `FN:` (full name) and `TEL:` (phone) fields. Email (`EMAIL:`) is imported too if present. If a VCF card has a phone but no name, it saves as "Unknown" — you can edit the contact afterward.

### CSV Format

For bulk contact import, use this CSV structure:

```csv
Name,Number,Email
John Smith,+1 234 567 8900,john@example.com
Jane Doe,+44 20 7946 0958,
```

For email import:
```csv
Name,Email,Subject,Body
Alice Chen,alice@example.com,Hello,Hi there
```

---

## Adding Real Email Sending

The compose modal saves emails to the database as "sent". To actually deliver emails, integrate [Resend](https://resend.com):

```bash
npm install resend
```

Add to `.env.local`:
```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="dashboard@yourdomain.com"
```

Update `src/app/api/emails/route.ts` POST handler:
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Inside the POST handler, after saving to DB:
await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL!,
  to: senderEmail,
  subject,
  text: body,
});
```

---

## Database Management

```bash
# View / edit data in a GUI
npm run db:studio

# Push schema changes after editing schema.prisma
npm run db:push

# Reset database and re-seed (WARNING: deletes all data)
npm run db:reset

# Generate Prisma client after schema changes
npm run db:generate
```

---

## Security Notes

- The JWT is stored in an **HttpOnly cookie** — not accessible from JavaScript, safe from XSS
- All API routes verify the JWT on every request via middleware
- The `/api/auth/setup` endpoint is protected by `SETUP_SECRET` and only works when zero users exist
- Passwords are hashed with bcrypt (12 rounds)
- Only one user (you) can ever exist in the database

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `PrismaClientInitializationError` | Check `DATABASE_URL` is correct and includes `?pgbouncer=true` |
| `Invalid token` on login | Make sure `JWT_SECRET` is the same in `.env.local` and Vercel |
| `Forbidden` on setup | Your `SETUP_SECRET` in the request doesn't match the env var |
| Vercel build fails | Check all env vars are set in Vercel dashboard |
| `Module not found: @/...` | Ensure `tsconfig.json` has `"paths": { "@/*": ["./src/*"] }` |
| Fonts not loading | Google Fonts are loaded via `next/font` — works automatically |

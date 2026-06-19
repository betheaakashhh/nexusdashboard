# Nexus — Private Personal Dashboard

A private all-in-one personal dashboard with contact management, email, task tracking, family health records, and a PIN-protected vault. Built with Next.js 15, Supabase (PostgreSQL), Prisma, Framer Motion, and TypeScript. Single deployment on Vercel — no separate backend needed.

---

## Preview

GitHub doesn't execute HTML/JS inside a rendered README, so the interactive showcase can't be embedded directly on this page. To view it:

- **Locally:** clone the repo and open [`nexus_dashboard_showcase.html`](./nexus_dashboard_showcase.html) in your browser.
- **Live link:** host the file for free with GitHub Pages (Settings → Pages → deploy from branch) and swap the line below for your published URL:

  **[View the live showcase →](https://your-username.github.io/nexus-dashboard/nexus_dashboard_showcase.html)**

---

## What's Inside

| Module | Description |
|--------|-------------|
| **Contacts** | Full contact book with VCF/CSV import, Fuse.js fuzzy search, tags, and linked tasks |
| **Tasks** | Priority task tracker with due-time email reminders and overdue detection |
| **Email** | In-app email client with inbox/sent/starred, compose, quick recipients, and CSV import |
| **Health** | Family health hub — records, vitals, medications, appointments, PDF reports, trend charts |
| **Private Vault** | PIN-protected vault for passwords, education records, identity docs, and file uploads |
| **Settings** | Theme, accent color, session management, auto-logout, health units, and data export |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| Animation | Framer Motion + GSAP |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | JWT (HttpOnly cookies) + bcrypt |
| State | Zustand |
| Search | Fuse.js (fuzzy contact search) |
| CSV parsing | Papaparse |
| Email delivery | Brevo SMTP API |
| Deployment | Vercel (frontend + API routes) |

---

## Full Feature List

### Contacts
- VCF and CSV bulk import
- Fuzzy search across name, phone, email, and notes (Fuse.js — typo-tolerant)
- Tags: Personal, Family, Work, Emergency — with colour-coded pills
- Alphabetical strip filter (A–Z) and sort by Recent / Name / Added
- Linked tasks per contact — view and manage tasks from the contact detail panel
- Quick actions: one-tap call, SMS, copy phone number
- Stats strip: total, family, work, and emergency counts
- Mobile: inline accordion detail, full-screen-width list

### Tasks
- Priority levels: High / Med / Low with colour-coded badges
- Due date + optional due time (HH:MM)
- Email reminders: 15 minutes before the due time, and again at the exact due time — only fires if the task is still pending
- Overdue detection with red highlighting
- Linked contact per task
- Quick-add: type a title and press Enter
- Filter by status (all / pending / done) and priority
- Task reminder cron endpoint: `POST /api/tasks/reminders` (run every minute via Vercel Cron or external scheduler)

### Email
- Tabs: Inbox / Sent / Starred with unread count badge on the Inbox
- Compose new email and reply to any message
- Quick recipients: saved email addresses shown as one-click chips in the compose modal
- Default sender name and "from" address configurable in Settings
- Email signature auto-appended to outgoing messages
- BCC self option
- CSV bulk import for email records
- Real sending via Brevo SMTP (add `BREVO_API_KEY` and `BREVO_FROM_EMAIL` to env)
- Mobile: bottom-sheet compose modal, full-screen email reader

### Health (new module)
Family health hub for tracking health data for every member of your household.

**Profiles**
- Create a health profile for each family member: self, spouse, child, parent, sibling, or other
- Store name, relation, date of birth, gender, blood group, allergies, chronic conditions, emergency contact, and a profile photo
- Overview card grid showing all family members with quick-access stats

**Health Records**
11 record types, each with title, date, doctor, hospital, diagnosis, notes, and optional file attachment (image or PDF, stored as base64):

| Type | Icon |
|------|------|
| Blood test | Lab results table with normal-range highlighting |
| Urine test | Lab results table |
| Imaging / scan | X-ray, MRI, CT, ultrasound |
| Vaccination | Vaccine name and batch info |
| Doctor visit | Consultation notes |
| Dental | Dental records |
| Eye exam | Vision test results |
| Mental health | Therapy and counselling notes |
| Surgery | Procedure details and outcome |
| Allergy | Allergy testing results |
| General | Catch-all for other records |

Lab results for blood and urine tests are stored as a JSON array of `{ name, value, unit, normalMin, normalMax, status }` rows and rendered as a colour-coded table (green = normal, red = high/low).

**Vitals Tracking**
Record any combination of the following per reading:
- Blood pressure (systolic / diastolic in mmHg) with status: Normal / Elevated / Stage 1 HT / Stage 2 HT / Crisis
- Heart rate (bpm)
- Weight (kg, stored; displayed in kg or lbs per Settings)
- Height (cm)
- BMI (calculated automatically when weight + height are both entered)
- Body temperature (°C, stored; displayed in °C or °F per Settings)
- Blood sugar / glucose (mg/dL, stored; displayed in mg/dL or mmol/L per Settings) with fasting / post-meal / random context
- SpO₂ (percentage)
- Respiratory rate (breaths per minute)

**Medications**
- Track name, generic name, dosage, frequency, route (oral / injection / topical / inhaled)
- Start date, end date (null = ongoing), prescribing doctor, specialty, purpose
- Active / Stopped status toggle
- Side effects and notes

**Appointments**
- Title, doctor, specialty, hospital, date, time
- Status: Scheduled / Completed / Cancelled / Missed
- Reason for visit and outcome notes
- Follow-up date
- Missed-appointment warning (red border when status is still Scheduled but date has passed)

**Reports panel**
- Slide-in panel showing trend charts for the selected family member over the last week / month / year
- Mini SVG line charts: blood pressure (systolic), heart rate, weight, blood glucose
- Mini SVG bar chart: health records filed per month (last 6 months)
- Record-type distribution bar chart
- Latest vitals snapshot with colour-coded status badges

**PDF health report**
- Opens a fully styled HTML report in a new tab with auto-print triggered
- Includes: profile header with photo, allergy and chronic condition alerts, latest vitals, active medications, all health records with lab tables, full appointment history
- Printable / saveable as PDF via the browser's print dialog

### Private Vault
A PIN-protected section for sensitive personal data.

**Passwords**
- Store credentials: name/label, user ID / username, password (masked with show/hide toggle), registration number, URL, notes
- Reveal credentials behind a click (hidden by default)
- Copy user ID or password to clipboard with one click
- Email credentials to yourself directly from the vault

**Education Records**
- Per-person education history: 10th, 12th, Diploma, Graduation, Post Graduation, PhD, or custom
- Institution, board/university, year, percentage/CGPA, roll number
- Optional certificate / mark sheet file attachment (image or PDF)

**Identity Documents**
- Aadhaar Card, PAN Card, ABHA ID, Passport, Voter ID, Driving Licence, Birth Certificate, or custom type
- Document number (with copy button), issuing authority, issue date, expiry date
- Optional scanned copy attachment

**Document Vault**
- General file storage: upload any PDF, image, or document
- Tag and categorise (e.g., "invoice", "certificate", "government")
- File size display, inline image preview, download link for PDFs

**PIN protection**
- Vault PIN stored as a bcrypt hash (12 rounds) — never in plain text or cookies
- 4+ digit numeric PIN required
- Change PIN (requires current PIN), remove PIN (requires current PIN)
- Forgot PIN: verify with account password to reset to a new PIN
- PIN check screen with visual dot indicators

### Settings

**Appearance**
- Theme: Dark / Light / System (follows OS preference)
- Accent colour: 8 presets + full custom colour picker (live preview)
- Compact mode: tighter spacing and smaller topbar
- Default landing page: Contacts / Tasks / Email / Vault

**Security**
- Change account password (requires current password, minimum 8 characters)
- Login activity: see all signed-in devices with browser, OS, IP address, and location
- Revoke any session remotely (signs that device out immediately)
- Download full login history as a `.txt` file
- Auto-logout timer: Off / 5 min / 15 min / 30 min / 1 hour
- Vault PIN management: set, change, remove, or reset (see Vault section above)

**Email**
- Default sender name and from-address
- Email signature (auto-appended to all composed emails)
- BCC self toggle
- Quick recipients list management

**Contacts**
- Default sort order: A–Z / Recent / Added
- Search fields: toggle which fields (name, phone, email, tags, notes) are searched
- Import duplicate handling: skip / overwrite / merge
- Export contacts as CSV or VCF

**Health**
- Weight unit: kg / lbs
- Height unit: cm / ft+in
- Temperature unit: °C / °F
- Blood glucose unit: mg/dL / mmol/L
- Appointment reminder lead time: 1 / 3 / 7 days (visual flag in the Health module)

**Data**
- Export all data (contacts, tasks, emails) as a single JSON file
- Clear all contacts / tasks / emails (irreversible, requires confirmation)

---

## Project Structure

```
nexus-dashboard/
├── prisma/
│   ├── schema.prisma          ← 17 DB models
│   └── seed.ts                ← Admin + sample data seeder
├── src/
│   ├── middleware.ts           ← Edge-runtime auth guard
│   ├── proxy.ts               ← Public path list for middleware
│   ├── types/index.ts         ← Shared TypeScript interfaces
│   ├── lib/
│   │   ├── auth.ts            ← JWT, bcrypt, cookie helpers, session parsing
│   │   ├── email.ts           ← Brevo SMTP sender, verification/reset emails
│   │   ├── prisma.ts          ← Prisma client singleton
│   │   ├── tokens.ts          ← Secure token generation (randomBytes + SHA-256)
│   │   └── vcf-parser.ts      ← VCF + CSV parsers for contacts and emails
│   ├── hooks/
│   │   ├── useAuth.ts         ← Zustand: user session
│   │   ├── useContacts.ts     ← Zustand: contacts CRUD + import
│   │   ├── useEmails.ts       ← Zustand: emails CRUD + import
│   │   ├── useGsapEntrance.ts ← GSAP entrance animation hook
│   │   ├── useSettings.ts     ← Zustand: settings, theme application
│   │   └── useTasks.ts        ← Zustand: tasks CRUD
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx    ← Desktop sidebar + mobile bottom nav
│   │   └── ui/
│   │       ├── FormField.tsx  ← Input, Textarea, Select, Btn components
│   │       └── Modal.tsx      ← Animated modal (desktop centre / mobile bottom sheet)
│   └── app/
│       ├── layout.tsx
│       ├── globals.css
│       ├── page.tsx           ← Redirects to /dashboard/contacts
│       ├── login/page.tsx
│       ├── register/page.tsx
│       ├── forgot-password/page.tsx
│       ├── reset-password/page.tsx
│       ├── api/
│       │   ├── auth/
│       │   │   ├── login/          ← POST: authenticate + create session
│       │   │   ├── logout/         ← POST: clear cookie + revoke session
│       │   │   ├── me/             ← GET: current user
│       │   │   ├── register/       ← POST: create account + send verification email
│       │   │   ├── verify-email/   ← GET: verify token, activate account
│       │   │   ├── verification-status/ ← GET: poll for email verification
│       │   │   ├── forgot-password/ ← POST: send password reset email
│       │   │   ├── reset-password/ ← POST: consume reset token, update password
│       │   │   ├── change-password/ ← POST: change password (requires current)
│       │   │   ├── setup/          ← POST: one-time admin creation (SETUP_SECRET)
│       │   │   ├── sessions/       ← GET: all active sessions
│       │   │   ├── sessions/[id]/  ← DELETE: revoke a session
│       │   │   └── sessions/export/ ← GET: download login history as .txt
│       │   ├── contacts/
│       │   │   ├── route.ts        ← GET list, POST create
│       │   │   ├── [id]/           ← GET, PATCH, DELETE
│       │   │   ├── import/         ← POST: VCF or CSV import
│       │   │   └── clear/          ← DELETE: wipe all contacts
│       │   ├── tasks/
│       │   │   ├── route.ts        ← GET list, POST create
│       │   │   ├── [id]/           ← PATCH, DELETE
│       │   │   └── reminders/      ← POST/GET: fire due-time email reminders
│       │   ├── emails/
│       │   │   ├── route.ts        ← GET list, POST create/send
│       │   │   ├── [id]/           ← GET, PATCH, DELETE
│       │   │   ├── import/         ← POST: CSV import
│       │   │   └── clear/          ← DELETE: wipe all emails
│       │   ├── health/
│       │   │   ├── profiles/       ← GET list, POST create
│       │   │   ├── profiles/[id]/  ← GET, PATCH, DELETE
│       │   │   ├── records/        ← GET list, POST create
│       │   │   ├── records/[id]/   ← PATCH, DELETE
│       │   │   ├── vitals/         ← GET list, POST create
│       │   │   ├── vitals/[id]/    ← DELETE
│       │   │   ├── medications/    ← GET list, POST create
│       │   │   ├── medications/[id]/ ← PATCH, DELETE
│       │   │   ├── appointments/   ← GET list, POST create
│       │   │   └── appointments/[id]/ ← PATCH, DELETE
│       │   ├── vault/
│       │   │   ├── route.ts        ← GET list, POST create (passwords)
│       │   │   ├── [id]/           ← PATCH, DELETE
│       │   │   ├── education/      ← GET list, POST create
│       │   │   ├── education/[id]/ ← PATCH, DELETE
│       │   │   ├── personal/       ← GET list, POST create
│       │   │   ├── personal/[id]/  ← PATCH, DELETE
│       │   │   ├── documents/      ← GET list, POST create
│       │   │   └── documents/[id]/ ← PATCH, DELETE
│       │   └── settings/
│       │       ├── route.ts        ← GET, PATCH user settings
│       │       ├── pin/            ← GET hasPin, POST set/update, DELETE remove
│       │       ├── pin/verify/     ← POST: check PIN against bcrypt hash
│       │       └── pin/reset/      ← POST: reset PIN using account password
│       └── dashboard/
│           ├── layout.tsx     ← Auth guard + session touch + auto-logout
│           ├── page.tsx       ← Redirects to defaultLanding from Settings
│           ├── contacts/page.tsx
│           ├── email/page.tsx
│           ├── tasks/page.tsx
│           ├── health/page.tsx
│           ├── private/page.tsx
│           └── settings/page.tsx
```

---

## Database Models (17 total)

**Core / Auth**
- `User` — email, password (bcrypt), name, role
- `UserSettings` — all settings fields (theme, accent, health units, email prefs, etc.)
- `UserSession` — per-device sessions with device, browser, OS, IP, location, timestamps
- `EmailVerificationToken` — SHA-256 hashed, 24 h expiry
- `PasswordResetToken` — SHA-256 hashed, 1 h expiry

**Content**
- `Contact` — name, phone, email, tag, notes
- `Task` — title, priority, due, dueTime, done, notified, contactId
- `Email` — sender, senderEmail, subject, body, preview, tab, unread, starred

**Vault**
- `VaultEntry` — passwords and credentials
- `EducationRecord` — education history with optional file
- `PersonalDocument` — identity documents with optional file
- `DocumentVault` — general file storage

**Health**
- `HealthProfile` — per-family-member profile with blood group, allergies, conditions
- `HealthRecord` — typed health records with optional lab results JSON and file
- `VitalRecord` — timestamped vitals (BP, HR, weight, BMI, glucose, SpO₂, temp)
- `Medication` — medication list with active/stopped status
- `HealthAppointment` — scheduled and past appointments

---

## Step-by-Step Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Go to **Project Settings → Database → Connection string**
3. Copy the **Transaction** mode URL (port `6543`) → `DATABASE_URL`
4. Copy the **Session** mode URL (port `5432`) → `DIRECT_URL`
5. Replace `[YOUR-PASSWORD]` in both URLs

### 2. Scaffold the project

```bash
npx create-next-app@latest nexus-dashboard --typescript --tailwind --app --no-eslint
cd nexus-dashboard
```

### 3. Install dependencies

```bash
npm install \
  @prisma/client prisma \
  bcryptjs jsonwebtoken \
  framer-motion gsap \
  zustand react-hot-toast \
  papaparse clsx fuse.js \
  @supabase/supabase-js

npm install -D \
  @types/bcryptjs @types/jsonwebtoken \
  @types/papaparse @types/node \
  ts-node autoprefixer
```

### 4. Copy all source files

Copy every file from this repository into its exact path (see project structure above for the full list).

### 5. Create the environment file

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

# Email delivery (Brevo — free tier: 300 emails/day)
BREVO_API_KEY="xkeysib-..."
BREVO_FROM_EMAIL="noreply@yourdomain.com"
BREVO_FROM_NAME="Nexus"
```

> **Note:** Without `BREVO_API_KEY`, registration and password reset still work — the app falls back to showing a direct verification link in the UI (dev mode). Email reminders for tasks also need this key.

### 6. Push the database schema

```bash
npx prisma db push
```

This creates all 17 tables. Verify in **Supabase → Table Editor**.

### 7. Create your admin account

**Option A — via the setup API (recommended for the first run):**
```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-SETUP_SECRET",
    "email": "you@example.com",
    "password": "yourpassword",
    "name": "Your Name"
  }'
```

**Option B — via the registration page:**

Open `http://localhost:3000/register`, sign up, and click the verification link shown in the UI (dev mode — no email required).

**Option C — via the seed script (adds sample data too):**
```bash
SEED_EMAIL=you@example.com SEED_PASSWORD=yourpassword SEED_NAME="Your Name" npm run db:seed
```

### 8. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/login`.

---

## Deployment to Vercel

### Option A — CLI

```bash
npm install -g vercel
vercel
```

### Option B — GitHub integration

1. Push your project to a private GitHub repo (`.env.local` must be in `.gitignore`)
2. Go to [vercel.com](https://vercel.com) → **New Project** → import from GitHub
3. Vercel auto-detects Next.js

### Add environment variables in Vercel

In **Vercel project → Settings → Environment Variables**, add:

| Key | Value | Environments |
|-----|-------|-------------|
| `DATABASE_URL` | Supabase transaction URL | Production, Preview |
| `DIRECT_URL` | Supabase session URL | Production, Preview |
| `JWT_SECRET` | 64-char random string | Production, Preview |
| `SETUP_SECRET` | Your setup passphrase | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL | Production |
| `BREVO_API_KEY` | Your Brevo key | Production, Preview |
| `BREVO_FROM_EMAIL` | Verified sender address | Production, Preview |
| `BREVO_FROM_NAME` | "Nexus" or your name | Production, Preview |

### Deploy

```bash
vercel --prod
```

### Create admin on production

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

## Task Reminders Cron

To receive email reminders for tasks with a due time, run this endpoint every minute:

```
POST /api/tasks/reminders
```

**Vercel Cron (add to `vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/tasks/reminders",
      "schedule": "* * * * *"
    }
  ]
}
```

**External cron (cron-job.org, etc.):**
Set a POST request to `https://your-app.vercel.app/api/tasks/reminders` every 1 minute.

The endpoint sends two emails per task:
1. 15 minutes before the due time
2. At the exact due time

Both fire only if the task is still pending (`done: false`) and not yet notified (`notified: false`). Emails go to the address set in **Settings → Email → Your email address**.

---

## Importing Contacts

### VCF (from phone or Google Contacts)

**Export from Google Contacts:**
1. Go to [contacts.google.com](https://contacts.google.com)
2. Select contacts → More actions → Export → vCard (for iOS Contacts)
3. Click **Import** in Nexus → select the `.vcf` file

### CSV format

```csv
Name,Number,Email
Rajan Kumar,+91 98765 43210,rajan@example.com
Priya Sharma,+91 87654 32109,
```

For email import:
```csv
Name,Email,Subject,Body
Alice Chen,alice@example.com,Hello,Hi there
```

---

## Adding Real Email Sending

The app ships with Brevo integration. Set `BREVO_API_KEY` and `BREVO_FROM_EMAIL` in your environment.

For Resend instead:
```bash
npm install resend
```

Update `src/lib/email.ts` to use the Resend SDK — the function signatures (`sendVerificationEmail`, `sendPasswordResetEmail`) stay the same.

---

## Database Management

```bash
# Push schema changes after editing schema.prisma
npm run db:push

# View and edit data in a GUI
npm run db:studio

# Reset database and re-seed (WARNING: deletes all data)
npm run db:reset

# Generate Prisma client after schema changes
npm run db:generate
```

---

## Security Architecture

- **JWT in HttpOnly cookie** — inaccessible from JavaScript, safe from XSS
- **bcrypt 12 rounds** — used for account passwords and vault PINs
- **SHA-256 token hashing** — email verification and password reset tokens are hashed before storage; the raw token only exists in the email link
- **Edge middleware** — all `/dashboard` and `/api` routes (except public paths) are protected; the raw JWT is verified in each API handler, not just in middleware
- **Session tracking** — every login creates a `UserSession` row with device fingerprint and IP; sessions can be revoked from Settings
- **PIN vault** — the vault PIN is stored as a separate bcrypt hash, never in the JWT cookie

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `PrismaClientInitializationError` | Check `DATABASE_URL` includes `?pgbouncer=true` |
| `Invalid token` on login | `JWT_SECRET` must be identical in `.env.local` and Vercel |
| `Forbidden` on setup endpoint | `SETUP_SECRET` in request must match env var |
| Email not received | Check `BREVO_API_KEY` and that sender domain is verified in Brevo |
| Vercel build fails | Confirm all env vars are set; `prisma generate` runs automatically on build |
| `Module not found: @/...` | Ensure `tsconfig.json` has `"paths": { "@/*": ["./src/*"] }` |

---

## Developer

`Aakash Kumar Sahu`

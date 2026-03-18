# MedMatch

MedMatch is a launch-ready MVP for connecting doctors with hospitals, clinics and healthcare recruiters. It is built with `Next.js`, `TypeScript`, `Tailwind CSS` and `Supabase`, with a structure kept intentionally simple so a non-developer can still follow the setup.

## What is included

- Public marketing website with a polished healthcare/tech visual style
- Sign up and login pages
- Doctor dashboard
- Facility dashboard
- Admin dashboard
- Public doctor directory
- Public opportunities directory
- Contact request flow
- Supabase SQL schema with Row Level Security
- Demo data seed
- Clear deployment path for Vercel

## 1. Open the project

1. Open the folder `C:\Users\nutzer\Documents\Playground` in VS Code.
2. Open a terminal in the same folder.

## 2. Install the project

Run:

```bash
npm install
```

Then create your local environment file:

```bash
copy .env.example .env.local
```

If you are on macOS or Linux, use:

```bash
cp .env.example .env.local
```

## 3. Create your Supabase project

1. Go to [Supabase](https://supabase.com/).
2. Create a new project.
3. Wait until the database is ready.
4. In the Supabase dashboard, open `Project Settings` then `API`.
5. Copy these values:
   - `Project URL`
   - `anon public key`
   - `service_role key`

## 4. Add your Supabase keys

Open the file `.env.local` and replace the placeholder values:

```env
NEXT_PUBLIC_APP_NAME=MedMatch
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 5. Create the database tables

In Supabase:

1. Open the `SQL Editor`.
2. Create a new query.
3. Paste the file contents from:
   - `C:\Users\nutzer\Documents\Playground\supabase\migrations\001_medmatch_schema.sql`
4. Run the query.

This creates:

- `users`
- `doctor_profiles`
- `facility_profiles`
- `job_offers`
- `contact_requests`
- `admin_notes`
- `documents`

It also creates:

- automatic `updated_at` handling
- doctor profile completion calculation
- Row Level Security policies

## 6. Add demo data

You have two options.

### Option A: easiest and recommended

Run:

```bash
npm run seed:demo
```

This script:

- creates demo users in Supabase Auth
- creates matching rows in the `users` table
- creates doctor profiles
- creates a facility profile
- creates demo job offers
- creates one contact request

Demo password for all seeded accounts:

```text
DemoPass123!
```

### Option B: SQL-only data

If you only want example profile and offer content, you can still use:

`C:\Users\nutzer\Documents\Playground\supabase\seed\seed.sql`

Important:

- this SQL file assumes matching users already exist in `auth.users`
- so it is better for partial/manual seeding, not for first-time full setup

## 7. Start the site locally

Run:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

## 8. Important note about demo mode

The project is intentionally friendly during setup:

- If Supabase is not connected yet, the site still renders with built-in demo data.
- Once you add the Supabase keys, the app switches to live Supabase reads.
- Forms and auth are already wired for Supabase. In demo mode they show success messages instead of writing to a database.

## 9. How to create an admin account

1. Register a normal account through the site.
2. Open Supabase `Table Editor`.
3. Open the `users` table.
4. Find your user row.
5. Change the `role` column to `admin`.

After that, your account can access:

- `/admin`
- `/admin/users`
- `/admin/profiles`
- `/admin/offers`
- `/admin/contacts`

## 10. How to deploy on Vercel

1. Push the project to GitHub.
2. Go to [Vercel](https://vercel.com/).
3. Import the GitHub repository.
4. Add the same environment variables from `.env.local`.
5. Set `NEXT_PUBLIC_APP_URL` to your final Vercel URL.
6. Deploy.

## 11. How to connect your custom domain later

In Vercel:

1. Open your project.
2. Go to `Settings` then `Domains`.
3. Add your domain.
4. Follow the DNS instructions shown by Vercel.
5. Once the domain works, update:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Also update your Supabase Auth redirect URLs in Supabase settings.

## 12. How to change the site name

The easiest option:

1. Change `NEXT_PUBLIC_APP_NAME` in `.env.local`
2. Restart the local server

You can also update:

- `C:\Users\nutzer\Documents\Playground\lib\site.ts`
- `C:\Users\nutzer\Documents\Playground\components\layout\logo.tsx`

## 13. How to change the colors

Open:

`C:\Users\nutzer\Documents\Playground\app\globals.css`

The main color variables are at the top:

- `--primary`
- `--secondary`
- `--accent`
- `--background`
- `--foreground`

## 14. How to edit the text

Most page content is inside the `app` folder.

Examples:

- Home page:
  `C:\Users\nutzer\Documents\Playground\app\page.tsx`
- Doctor page:
  `C:\Users\nutzer\Documents\Playground\app\for-doctors\page.tsx`
- Facility page:
  `C:\Users\nutzer\Documents\Playground\app\for-facilities\page.tsx`
- Legal page:
  `C:\Users\nutzer\Documents\Playground\app\legal\page.tsx`

## 15. Project structure

```text
app/
  admin/
  contact/
  dashboard/
  doctors/
  for-doctors/
  for-facilities/
  how-it-works/
  legal/
  login/
  opportunities/
  privacy/
  register/
components/
  dashboard/
  forms/
  layout/
  marketing/
  ui/
lib/
  data/
  supabase/
  validations/
supabase/
  migrations/
  seed/
types/
```

## 16. Files to know first

- Main landing page:
  `C:\Users\nutzer\Documents\Playground\app\page.tsx`
- Shared dashboard layout:
  `C:\Users\nutzer\Documents\Playground\components\layout\dashboard-shell.tsx`
- Supabase schema:
  `C:\Users\nutzer\Documents\Playground\supabase\migrations\001_medmatch_schema.sql`
- Demo data:
  `C:\Users\nutzer\Documents\Playground\supabase\seed\seed.sql`
- Server actions:
  `C:\Users\nutzer\Documents\Playground\lib\actions.ts`

## 17. Final reminder before production

Before launching publicly, replace:

- legal notice
- privacy text
- company contact details
- demo content
- demo emails
- placeholder URLs

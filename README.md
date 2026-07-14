# Providers

A single-purpose PWA for keeping a personal list of healthcare providers (name, credentials, hospital, specialty, address, role, phone, fax, notes). Email/password auth and storage via Supabase, each user only sees their own data via Row Level Security.

## Stack

- Vite + React
- Supabase (Auth + Postgres, with RLS)
- `vite-plugin-pwa` for installable PWA support (manifest.json + service worker)

## 1. Set up the database

In your Supabase project dashboard, go to **SQL Editor -> New query**. Run each file in [`supabase/migrations/`](supabase/migrations) in order (001, 002, ...) — paste the contents and click Run. Each one is a small, one-time change; run any new ones that show up after a `git pull` too.

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your project's URL and publishable (anon) key, found in **Project Settings -> API** in the Supabase dashboard:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

This repo's `.env` is already filled in for the project you provided. `.env` is gitignored — never commit it.

## 3. Run locally

```bash
npm install
npm run dev
```

## 4. Build

```bash
npm run build
npm run preview   # serve the production build locally
```

## Deploy to Vercel

1. Push this repo to GitHub (or another git provider).
2. In Vercel, "Add New Project" and import the repo. Framework preset: **Vite** (auto-detected).
3. Add the two environment variables from step 2 above (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy. `vercel.json` is already set up to rewrite all routes to `index.html`.

## Notes

- By default Supabase requires email confirmation before a new account can sign in. If you want to skip that for testing, go to **Authentication -> Providers -> Email** in the Supabase dashboard and disable "Confirm email".
- Scope is intentionally minimal: login + a single Providers table. No insurance, appointments, tasks, documents, or audit logging.

# Hackathon Boilerplate

Minimal React + Tailwind + Supabase (auth) starter.

## Structure

```
src/
  components/   # shared UI (Navbar)
  pages/        # page components (Login, Signup, Dashboard)
  hooks/        # useAuth
  lib/          # supabaseClient.js
  routes/       # route definitions (file-based routing)
```

## Run locally

```bash
npm install
npm run dev
```

## Environment variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

## Auth

- `/signup` — email/password sign up
- `/login` — email/password sign in
- `/dashboard` — protected; logged-out users are redirected to `/login`
- `/` — redirects to `/dashboard` or `/login` depending on session

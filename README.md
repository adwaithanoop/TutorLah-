# TutorLah

Peer tutoring for NUS students. Find someone who did well in your module, book a
session, and pay safely through escrow.

## What it does

- **Dual-mode dashboard.** One account, two modes. Switch between student and tutor from
  the dashboard: students search and book, tutors manage requests and availability.
- **Verified tutors.** Tutors upload their transcript to get a verified badge for a
  module. Students search by module code from the dashboard.
- **Escrow booking.** Payment is held until the session is over and the tutor submits a
  report, so students aren't left out of pocket.
- **SOS requests.** Post an urgent request and active tutors bid on it in real time. You
  pick the offer you want.
- **Reliability score.** Tutors are ranked by a score built from five things: ratings,
  completion rate, verification, grade, and how recently they took the module. It's
  computed on the server.
- **Group sessions.** The price per student drops as more people join.
- **Academic Passport.** Each session ends with a short report so the next tutor knows
  where the student is stuck.
- **Scheduling.** Book from the overlap of both people's free slots.

## Tech stack

- Next.js 16 (App Router) and TypeScript
- Supabase (Postgres, Auth, Realtime) with Row-Level Security
- Tailwind CSS 4
- Jest for the scoring and pricing logic
- Deployed on Vercel, module data from NUSMods

## Running locally

You need Node 20+ and Docker (Docker runs the local Supabase stack).

```bash
npm install
npx supabase start          # Postgres + Auth + Mailpit in Docker
```

Copy the URL and keys that `supabase start` prints into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

Then:

```bash
npx supabase db reset       # run migrations and seed demo data
npm run dev                 # http://localhost:3000
```

Sign in at `/auth/login` with any `@u.nus.edu` email. Locally the login code shows up in
Mailpit at http://127.0.0.1:54324. After signing in you land on `/dashboard`; try a search
like `/dashboard?module=CS2040S` and use the mode switch to flip between student and tutor.

Other scripts: `npm run build`, `npm run lint`, `npm test`, and `npm run sync:modules`
(pull the full NUSMods catalog).

## Work discipline

Feature branches and PRs only, no direct pushes to main. CI runs lint, tests, and a build
on every PR. The business logic (scoring, pricing, escrow) stays on the server and is unit
tested; the frontend just renders and collects input.

## Status

- **M1 (done):** NUS email sign-in enforced at the database, the initial schema with RLS,
  and tutor search ranked by the reliability score.
- **M2 (in progress):** profiles with transcript upload, booking and escrow with a
  server-side release guard, and the SOS dashboard.
- **M3 (in progress):** real-time SOS bidding, group pricing, session reports feeding the
  Academic Passport, reviews, scheduling, and an installable PWA.

## Team

- **Adwaith Anoop**
- **Daniel Wong**

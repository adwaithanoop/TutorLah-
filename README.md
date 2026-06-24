# TutorLah

Peer tutoring for NUS students. Find someone who did well in your module, top up a
wallet, and book a session whose payment is held until the session is complete.

## What it does

- **Dual-mode dashboard.** One account, two modes. Switch between student and tutor from
  the dashboard: students search and book, tutors manage requests and availability.
- **Verified tutors.** Tutors upload their transcript to get a verified badge for a
  module. Students search by module code from the dashboard.
- **Wallet and held payments.** Students top up a wallet with card or PayNow through
  Stripe. The wallet is charged only when a tutor accepts a request, and the money is held
  until the session is over and the tutor submits a report, so students are not left out of
  pocket.
- **SOS requests.** Post an urgent request and active tutors bid on it in real time. You
  pick the offer you want.
- **Reliability score.** Tutors are ranked by a score built from five things: ratings,
  completion rate, verification, grade, and how recently they took the module. It's
  computed on the server.
- **Group sessions.** The price per student drops as more people join.
- **Academic Passport.** Each session ends with a short report, which a tutor can only
  submit once the session is actually over, so the next tutor knows where the student is
  stuck.
- **Weekly availability.** Tutors publish recurring weekly slots, one to two hours each,
  and those are the exact times students can book. They can update them any time without
  touching sessions already booked.
- **Request marketplace.** Students pick a session length and the times that suit them and
  send requests to as many tutors as they like, even across modules. The first tutor to
  accept gets the session and only then is the student charged; every other request for the
  same module, and anything clashing with the booked time, cancels itself. Tutors can
  accept, decline, or counter with their own free times, and a request expires if it is not
  answered within two hours.

## Tech stack

- Next.js 16 (App Router) and TypeScript
- Supabase (Postgres, Auth, Realtime) with Row-Level Security
- Tailwind CSS 4
- Stripe Checkout for wallet top-ups
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

## Payments

Wallet top-ups go through Stripe Checkout. Most of the app runs without them, but to try
top-ups locally add Stripe test keys to `.env.local` and forward webhooks with the Stripe
CLI:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...     # printed when you run the command below
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=any-random-string

stripe listen --forward-to localhost:3000/api/wallet/webhook
```

Keep `stripe listen` running while you test. A booking is only created once it is paid
from the wallet, and a daily Vercel cron credits any top-up whose webhook was missed.

## Work discipline

Feature branches and PRs only, no direct pushes to main. CI runs lint, tests, and a build
on every PR. The business logic (scoring, pricing, payments) stays on the server and is
unit tested, the frontend just renders and collects input.

## Status

- **M1 (done):** NUS email sign-in enforced at the database, the initial schema with RLS,
  and tutor search ranked by the reliability score.
- **M2 (in progress):** profiles with transcript upload, a wallet funded by Stripe
  top-ups, pay-to-confirm bookings with funds held until the session is done, and the SOS
  dashboard.
- **M3 (in progress):** real-time SOS bidding, group pricing, session reports feeding the
  Academic Passport, reviews, scheduling, and an installable PWA.

## Team

- **Adwaith Anoop**
- **Daniel Wong**

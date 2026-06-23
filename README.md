# TutorLah

Peer tutoring for NUS students. Find someone who did well in your module, top up a
wallet, and book a session whose payment is held until the session is complete.

## What it does

- **Dual-mode dashboard.** One account, two modes. Switch between student and tutor from
  the dashboard: students search and book, tutors manage requests and availability.
- **Verified tutors.** Tutors upload their transcript to get a verified badge for a
  module. Students search by module code from the dashboard.
- **Wallet and held payments.** Students top up a wallet with card or PayNow through
  Stripe, then pay from it to confirm a booking. The money is held until the session is
  over and the tutor submits a report, so students are not left out of pocket.
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


erDiagram
    %% Core Entities
    profiles {
        uuid id PK
        text full_name
        text faculty
        text year
        boolean is_active
        text avatar_color
        numeric rate_per_hour
        numeric avg_rating
        integer rating_count
        integer sessions_completed
        integer sessions_booked
        timestamp created_at
    }

    subjects {
        text module_code PK
        USER_DEFINED level
        text title
        text parent_id FK
        timestamp created_at
        text module_display
    }

    admins {
        uuid id PK, FK
        timestamp granted_at
        uuid granted_by FK
    }

    %% Tutoring & Modules
    tutor_modules {
        uuid id PK
        uuid tutor_id FK
        text module_code FK
        USER_DEFINED grade
        date completed_at
        boolean is_verified
        timestamp created_at
        text transcript_path
        USER_DEFINED verification_status
        uuid reviewed_by FK
        timestamp reviewed_at
        text review_note
        boolean allow_resubmit
    }

    module_verification_blocks {
        uuid tutor_id PK, FK
        text module_code PK, FK
        text reason
        uuid blocked_by FK
        timestamp blocked_at
    }

    %% Booking & Scheduling System
    bookings {
        uuid id PK
        uuid student_id FK
        uuid tutor_id FK
        text module_code FK
        timestamp scheduled_start
        timestamp scheduled_end
        USER_DEFINED price_type
        numeric amount
        USER_DEFINED escrow_state
        boolean report_submitted
        timestamp created_at
    }

    booking_requests {
        uuid id PK
        uuid student_id FK
        uuid tutor_id FK
        text module_code FK
        timestamp scheduled_start
        timestamp scheduled_end
        numeric amount
        USER_DEFINED status
        timestamp expires_at
        uuid booking_id FK
        timestamp created_at
        timestamp resolved_at
    }

    counter_offers {
        uuid id PK
        uuid request_id FK
        uuid student_id FK
        uuid tutor_id FK
        text module_code FK
        numeric amount
        USER_DEFINED status
        timestamp expires_at
        uuid booking_id FK
        timestamp created_at
        timestamp resolved_at
    }

    counter_offer_slots {
        uuid id PK
        uuid offer_id FK
        timestamp scheduled_start
        timestamp scheduled_end
    }

    group_sessions {
        uuid id PK
        uuid tutor_id FK
        text module_code FK
        text title
        numeric total_cost
        integer max_participants
        numeric floor_per_student
        timestamp scheduled_start
        timestamp scheduled_end
        text status
        timestamp created_at
    }

    group_enrolments {
        uuid id PK
        uuid group_session_id FK
        uuid student_id FK
        numeric price_charged
        timestamp created_at
    }

    availability {
        uuid id PK
        uuid profile_id FK
        timestamp starts_at
        timestamp ends_at
        text kind
        timestamp created_at
    }

    availability_blocks {
        uuid id PK
        uuid profile_id FK
        smallint weekday
        integer start_minute
        integer end_minute
        timestamp created_at
    }

    %% Post-session & Communication
    session_reports {
        uuid id PK
        uuid booking_id UK, FK
        uuid student_id FK
        uuid tutor_id FK
        text module_code FK
        text misconceptions
        text summary
        timestamp created_at
    }

    reviews {
        uuid id PK
        uuid booking_id UK, FK
        uuid student_id FK
        uuid tutor_id FK
        integer rating
        text comment
        timestamp created_at
    }

    messages {
        uuid id PK
        uuid sender_id FK
        uuid recipient_id FK
        text body
        timestamp created_at
    }

    %% SOS System
    sos_requests {
        uuid id PK
        uuid student_id FK
        text module_code FK
        text description
        USER_DEFINED status
        timestamp created_at
    }

    sos_bids {
        uuid id PK
        uuid request_id FK
        uuid tutor_id FK
        numeric rate
        USER_DEFINED status
        timestamp created_at
    }

    %% Financial / Wallet
    wallets {
        uuid id PK, FK
        numeric balance
        timestamp updated_at
    }

    wallet_transactions {
        uuid id PK
        uuid wallet_id FK
        uuid booking_id FK
        USER_DEFINED kind
        numeric amount
        timestamp created_at
    }

    wallet_topups {
        uuid id PK
        uuid user_id FK
        text stripe_session_id UK
        numeric amount
        USER_DEFINED status
        timestamp created_at
        timestamp completed_at
    }

    %% Relationships
    subjects ||--o{ subjects : "parent_id"
    profiles ||--o{ admins : "grants/has role"
    profiles ||--o{ admins : "granted_by"
    
    profiles ||--o{ tutor_modules : "tutors"
    profiles ||--o{ tutor_modules : "reviews"
    subjects ||--o{ tutor_modules : "applies to"
    profiles ||--o{ module_verification_blocks : "blocked tutor"
    profiles ||--o{ module_verification_blocks : "blocked by admin"
    subjects ||--o{ module_verification_blocks : "blocked for"

    profiles ||--o{ bookings : "student"
    profiles ||--o{ bookings : "tutor"
    subjects ||--o{ bookings : "for subject"

    profiles ||--o{ booking_requests : "student"
    profiles ||--o{ booking_requests : "tutor"
    subjects ||--o{ booking_requests : "for subject"
    bookings ||--o| booking_requests : "fulfills"

    booking_requests ||--o{ counter_offers : "counters"
    profiles ||--o{ counter_offers : "student"
    profiles ||--o{ counter_offers : "tutor"
    subjects ||--o{ counter_offers : "for subject"
    bookings ||--o| counter_offers : "fulfills"
    counter_offers ||--o{ counter_offer_slots : "proposes"

    profiles ||--o{ group_sessions : "hosts"
    subjects ||--o{ group_sessions : "covers"
    group_sessions ||--o{ group_enrolments : "has"
    profiles ||--o{ group_enrolments : "enrolled student"

    profiles ||--o{ availability : "sets"
    profiles ||--o{ availability_blocks : "sets recurring"

    bookings ||--o| session_reports : "documents"
    profiles ||--o{ session_reports : "student"
    profiles ||--o{ session_reports : "tutor"
    subjects ||--o{ session_reports : "subject"

    bookings ||--o| reviews : "rates"
    profiles ||--o{ reviews : "by student"
    profiles ||--o{ reviews : "for tutor"

    profiles ||--o{ messages : "sends"
    profiles ||--o{ messages : "receives"

    profiles ||--o{ sos_requests : "creates"
    subjects ||--o{ sos_requests : "targets"
    sos_requests ||--o{ sos_bids : "receives"
    profiles ||--o{ sos_bids : "placed by"

    profiles ||--|| wallets : "owns"
    wallets ||--o{ wallet_transactions : "logs"
    bookings ||--o{ wallet_transactions : "funds"
    profiles ||--o{ wallet_topups : "initiates"

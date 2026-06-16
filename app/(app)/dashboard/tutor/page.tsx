import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ESCROW_STATE_LABELS, ESCROW_STATE_STYLES } from "@/app/components/booking/escrowState";
import AddModuleForm from "@/app/components/profile/AddModuleForm";
import ModuleList, { type ProfileModule } from "@/app/components/profile/ModuleList";

interface UpcomingBooking {
  id: string;
  module_code: string;
  scheduled_start: string;
  scheduled_end: string;
  amount: number;
  escrow_state: string;
  student: { full_name: string } | null;
}

const QUICK_ACTIONS = [
  {
    href: "/sos",
    title: "SOS feed",
    description: "See live requests for your verified modules and submit a bid.",
  },
  {
    href: "/bookings",
    title: "Bookings",
    description: "Run upcoming sessions and submit reports to release escrow.",
  },
  {
    href: "/schedule",
    title: "Availability",
    description: "Keep your free slots current so students can propose times.",
  },
];

export default async function TutorDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_active, avg_rating, rating_count, sessions_completed")
    .eq("id", user!.id)
    .maybeSingle();

  const { count: verifiedModules } = await supabase
    .from("tutor_modules")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", user!.id)
    .eq("is_verified", true);

  const { data: moduleRows } = await supabase
    .from("tutor_modules")
    .select(
      "id, module_code, grade, completed_at, is_verified, verification_status, review_note, transcript_path, subjects(title)",
    )
    .eq("tutor_id", user!.id)
    .order("completed_at", { ascending: false });

  const modules = (moduleRows as ProfileModule[] | null) ?? [];

  const { data: upcomingData } = await supabase
    .from("bookings")
    .select(
      "id, module_code, scheduled_start, scheduled_end, amount, escrow_state, student:profiles!bookings_student_id_fkey(full_name)",
    )
    .eq("tutor_id", user!.id)
    .gte("scheduled_start", new Date().toISOString())
    .not("escrow_state", "in", "(cancelled,refunded)")
    .order("scheduled_start", { ascending: true })
    .limit(5);

  const upcoming = (upcomingData as UpcomingBooking[] | null) ?? [];
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "there";
  const isActive = profile?.is_active ?? false;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Tutor mode</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-indigo-950">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-indigo-900/60">Respond to requests and grow your Reliability Score.</p>
        </div>
        <Link
          href="/profile"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            isActive
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-indigo-400"}`} />
          {isActive ? "Active: Receiving SOS" : "Inactive"}
        </Link>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-indigo-900/60">Verified modules</p>
          <p className="mt-1 text-3xl font-bold text-indigo-950">{verifiedModules ?? 0}</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-indigo-900/60">Average rating</p>
          <p className="mt-1 text-3xl font-bold text-indigo-950">
            {profile?.rating_count ? Number(profile.avg_rating).toFixed(1) : "—"}
            <span className="ml-1 text-base font-medium text-indigo-900/40">
              ({profile?.rating_count ?? 0})
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-indigo-900/60">Sessions completed</p>
          <p className="mt-1 text-3xl font-bold text-indigo-950">{profile?.sessions_completed ?? 0}</p>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-indigo-950">Upcoming sessions</h2>
          <Link href="/bookings" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Manage all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-indigo-200 bg-white p-8 text-center text-sm text-indigo-900/60">
            No upcoming sessions booked yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white p-5 shadow-soft"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-indigo-700">{b.module_code}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ESCROW_STATE_STYLES[b.escrow_state]}`}
                    >
                      {ESCROW_STATE_LABELS[b.escrow_state]}
                    </span>
                    <span className="text-xs text-indigo-900/50">with {b.student?.full_name ?? "a student"}</span>
                  </div>
                  <p className="mt-1 text-xs text-indigo-900/60">
                    {new Date(b.scheduled_start).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} →{" "}
                    {new Date(b.scheduled_end).toLocaleTimeString([], { timeStyle: "short" })}
                  </p>
                </div>
                <span className="text-lg font-black text-indigo-950">${Number(b.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-bold text-indigo-950">Modules you tutor</h2>
        <div className="space-y-4">
          <ModuleList modules={modules} userId={user!.id} />
          <AddModuleForm />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map(({ href, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col rounded-xl border border-indigo-100 bg-white p-6 shadow-soft"
          >
            <h3 className="text-base font-bold text-indigo-950">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-indigo-900/60">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
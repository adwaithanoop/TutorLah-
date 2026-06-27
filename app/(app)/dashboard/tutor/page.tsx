import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { ESCROW_STATE_LABELS, ESCROW_STATE_STYLES } from "@/app/components/booking/escrowState";
import AddModuleForm from "@/app/components/modules/AddModuleForm";
import ModuleList, { type TutorModule } from "@/app/components/modules/ModuleList";
import VerifiedModuleList from "@/app/components/modules/VerifiedModuleList";
import AvailabilityToggle from "@/app/components/dashboard/AvailabilityToggle";

interface UpcomingBooking {
  id: string;
  module_code: string;
  scheduled_start: string;
  scheduled_end: string;
  amount: number;
  escrow_state: string;
  student: { full_name: string } | null;
}

export default async function TutorDashboard() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  // profile stats, tutor's modules and next few sessions
  const [{ data: profile }, { data: moduleRows }, { data: upcomingData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, is_active, receiving_sos, avg_rating, rating_count, sessions_completed")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("tutor_modules")
      .select(
        "id, module_code, grade, completed_at, is_verified, verification_status, review_note, reviewed_at, allow_resubmit, transcript_path, subjects(title)",
      )
      .eq("tutor_id", user!.id)
      .order("completed_at", { ascending: false }),
    supabase
      .from("bookings")
      .select(
        "id, module_code, scheduled_start, scheduled_end, amount, escrow_state, student:profiles!bookings_student_id_fkey(full_name)",
      )
      .eq("tutor_id", user!.id)
      .gte("scheduled_start", new Date().toISOString())
      .not("escrow_state", "in", "(cancelled,refunded)")
      .order("scheduled_start", { ascending: true })
      .limit(5),
  ]);

  // split modules into verified vs still under review
  const modules = (moduleRows as TutorModule[] | null) ?? [];
  const verifiedModules = modules.filter((m) => m.verification_status === "verified");
  const reviewModules = modules.filter((m) => m.verification_status !== "verified");

  const upcoming = (upcomingData as UpcomingBooking[] | null) ?? [];
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "there";

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
        <AvailabilityToggle
          initialActive={profile?.is_active ?? false}
          initialReceivingSos={profile?.receiving_sos ?? false}
        />
      </header>

      {/* quick stat cards */}
      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-indigo-900/60">Verified modules</p>
          <p className="mt-1 text-3xl font-bold text-indigo-950">{verifiedModules.length}</p>
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
        {/* next sessions on the calendar */}
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
        {/* verified modules this tutor can teach */}
        <h2 className="mb-4 text-xl font-bold tracking-tight text-indigo-950">Your modules</h2>
        <VerifiedModuleList modules={verifiedModules} />
      </section>

      <section className="mb-10">
        {/* still under review, add module form */}
        <h2 className="mb-4 text-lg font-bold text-indigo-950">Modules pending verification</h2>
        <div className="space-y-4">
          <ModuleList modules={reviewModules} userId={user!.id} />
          <AddModuleForm userId={user!.id} />
        </div>
      </section>
    </main>
  );
}
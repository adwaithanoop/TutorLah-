import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { listSubjects } from "@/lib/modules/catalog";
import { searchTutors } from "@/lib/tutors/search";
import { moduleCodeSchema } from "@/lib/validation/search";
import TutorResultCard from "@/app/components/TutorResultCard";
import DashboardModuleSearch from "@/app/components/DashboardModuleSearch";
import { backgroundUrl } from "@/lib/backgrounds";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function StudentDashboard({ searchParams }: { searchParams: SearchParams }) {
  const rawModule = first((await searchParams).module) ?? "";
  const parsed = moduleCodeSchema.safeParse(rawModule);

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  const [{ data: profile }, tutors, modules] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, sessions_booked, sessions_completed")
      .eq("id", user!.id)
      .maybeSingle(),
    parsed.success ? searchTutors(supabase, parsed.data) : Promise.resolve([]),
    listSubjects(),
  ]);
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "there";

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Student mode</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-indigo-950">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-indigo-900/60">Find module-verified help and track your progress.</p>
      </header>

      <section className="mb-10 rounded-2xl bg-indigo-600 text-white shadow-soft-lg">
        <div className="grid md:grid-cols-2">
          <div className="p-7 sm:p-9">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Need help with a module?</h2>
            <p className="mt-1 text-indigo-100">
              Search any NUS module code to see verified tutors ranked by Reliability Score.
            </p>
            <DashboardModuleSearch modules={modules} initialModule={rawModule} />
            {parsed.success && (
              <p className="mt-3 text-sm text-indigo-100">
                Showing tutors for <span className="font-mono font-semibold text-white">{parsed.data}</span>
              </p>
            )}
          </div>
          <div
            aria-hidden
            className="relative hidden overflow-hidden rounded-r-2xl bg-contain bg-no-repeat bg-right md:block"
            style={{ backgroundImage: `url("${backgroundUrl("dashboardSearch")}")` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-600/40 to-transparent" />
          </div>
        </div>
      </section>

      {parsed.success ? (
        tutors.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorResultCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-indigo-200 bg-white p-12 text-center">
            <p className="font-semibold text-indigo-900">No verified tutors for {parsed.data} yet.</p>
            <p className="mt-1 text-sm text-indigo-900/60">Check back soon. Tutors are joining every week.</p>
          </div>
        )
      ) : (
        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-soft">
            <p className="text-sm font-medium text-indigo-900/60">Sessions booked</p>
            <p className="mt-1 text-3xl font-bold text-indigo-950">{profile?.sessions_booked ?? 0}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-soft">
            <p className="text-sm font-medium text-indigo-900/60">Sessions completed</p>
            <p className="mt-1 text-3xl font-bold text-indigo-950">{profile?.sessions_completed ?? 0}</p>
          </div>
        </section>
      )}
    </main>
  );
}
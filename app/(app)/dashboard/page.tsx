import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { searchTutors } from "@/lib/tutors/search";
import { moduleCodeSchema } from "@/lib/validation/search";
import TutorResultCard from "@/app/components/TutorResultCard";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const QUICK_ACTIONS = [
  {
    href: "/sos",
    title: "Post an SOS",
    description: "Stuck right now? Call for available tutors and get live bids.",
  },
  {
    href: "/groups",
    title: "Join a group",
    description: "Split the cost: price drops per seat as more students join.",
  },
  {
    href: "/schedule",
    title: "Set calendar",
    description: "Mark your free slots so booking a session is one tap.",
  },
  {
    href: "/passport",
    title: "Academic Passport",
    description: "Review past session reports and the gaps tutors flagged.",
  },
];

export default async function StudentDashboard({ searchParams }: { searchParams: SearchParams }) {
  const rawModule = first((await searchParams).module) ?? "";
  const parsed = moduleCodeSchema.safeParse(rawModule);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, sessions_booked, sessions_completed")
    .eq("id", user!.id)
    .maybeSingle();

  const tutors = parsed.success ? await searchTutors(supabase, parsed.data) : [];
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

      <section className="mb-10 rounded-2xl bg-indigo-600 p-7 text-white shadow-soft-lg sm:p-9">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Need help with a module?</h2>
        <p className="mt-1 text-indigo-100">
          Search any NUS module code to see verified tutors ranked by Reliability Score.
        </p>
        <form method="get" action="/dashboard" className="mt-5 flex max-w-md gap-2">
          <input
            name="module"
            type="text"
            defaultValue={rawModule}
            placeholder="e.g. CS2040S"
            autoComplete="off"
            className="flex-1 rounded-lg border border-transparent bg-white/95 px-3.5 py-2.5 text-sm text-indigo-950 placeholder-indigo-900/40 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
            Search
          </button>
        </form>
        {parsed.success && (
          <p className="mt-3 text-sm text-indigo-100">
            Showing tutors for <span className="font-mono font-semibold text-white">{parsed.data}</span>
          </p>
        )}
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
        <>
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
        </>
      )}
    </main>
  );
}
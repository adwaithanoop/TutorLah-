import { createClient } from "@/lib/supabase/server";
import { searchTutors } from "@/lib/tutors/search";
import { moduleCodeSchema } from "@/lib/validation/search";
import TutorResultCard from "@/app/components/TutorResultCard";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function TutorsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawModule = first(params.module) ?? "";
  const parsed = moduleCodeSchema.safeParse(rawModule);

  const supabase = await createClient();
  const tutors = parsed.success ? await searchTutors(supabase, parsed.data) : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find a tutor</h1>
        <p className="mt-1 mb-6 text-gray-500">Ranked by 5-Factor Reliability Score, highest first.</p>
        <form method="get" action="/tutors" className="flex max-w-md gap-2">
          <input
            name="module"
            type="text"
            defaultValue={rawModule}
            placeholder="Module code, e.g. CS2040S"
            autoComplete="off"
            className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Search
          </button>
        </form>
        {parsed.success && (
          <p className="mt-3 text-sm text-gray-500">
            Showing tutors for <span className="font-mono font-semibold text-indigo-600">{parsed.data}</span>
          </p>
        )}
      </div>

      {parsed.success && tutors.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="font-semibold text-gray-700">No verified tutors for {parsed.data} yet.</p>
          <p className="mt-1 text-sm text-gray-500">Check back soon. Tutors are joining every week.</p>
        </div>
      )}

      {tutors.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor) => (
            <TutorResultCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}
    </main>
  );
}

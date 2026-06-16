import { createClient } from "@/lib/supabase/server";
import ReviewActions from "@/app/components/admin/ReviewActions";
import { formatTerm } from "@/lib/modules/terms";

interface PendingRow {
  id: string;
  module_code: string;
  grade: string;
  completed_at: string;
  transcript_path: string | null;
  profiles: { full_name: string; year: string | null; faculty: string | null } | null;
  subjects: { title: string } | null;
}

export default async function VerificationsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("tutor_modules")
    .select(
      "id, module_code, grade, completed_at, transcript_path, profiles!tutor_id(full_name, year, faculty), subjects(title)",
    )
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true })
    .returns<PendingRow[]>();

  const rows = data ?? [];
  const withUrls = await Promise.all(
    rows.map(async (row) => {
      let transcriptUrl: string | null = null;
      if (row.transcript_path) {
        const { data: signed } = await supabase.storage
          .from("transcripts")
          .createSignedUrl(row.transcript_path, 120);
        transcriptUrl = signed?.signedUrl ?? null;
      }
      return { ...row, transcriptUrl };
    }),
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-indigo-950">Transcript verification</h1>
      <p className="mb-8 text-gray-500">
        Review each transcript and confirm the name, module, and grade match before approving.
      </p>

      {withUrls.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
          Nothing waiting for review. New submissions will show up here.
        </p>
      ) : (
        <ul className="space-y-4">
          {withUrls.map((row) => (
            <li key={row.id} className="rounded-2xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-indigo-700">
                      {row.module_code}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">{row.grade}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {row.profiles?.full_name ?? "Unknown tutor"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {row.subjects?.title} · completed {formatTerm(row.completed_at)}
                    {row.profiles?.faculty ? ` · ${row.profiles.faculty}` : ""}
                  </p>
                  {row.transcriptUrl ? (
                    <a
                      href={row.transcriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      View transcript
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-amber-600">No transcript uploaded</p>
                  )}
                </div>
                <ReviewActions moduleId={row.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

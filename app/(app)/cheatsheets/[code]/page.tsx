import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTerm } from "@/lib/modules/terms";
import { getAssessments, assessmentRank } from "@/lib/modules/assessments";
import CheatsheetUpload from "@/app/components/cheatsheet/CheatsheetUpload";
import DeleteCheatsheetButton from "@/app/components/cheatsheet/DeleteCheatsheetButton";

export default async function ModuleCheatsheetsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).toUpperCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: subject } = await supabase
    .from("subjects")
    .select("title")
    .eq("module_code", code)
    .maybeSingle();

  const { data: rows } = await supabase
    .from("cheatsheets")
    .select(
      "id, test_label, title, file_path, created_at, uploader_id, uploader:profiles!cheatsheets_uploader_id_fkey(full_name)",
    )
    .eq("module_code", code)
    .order("created_at", { ascending: false });

  const sheets = rows ?? [];
  type Sheet = (typeof sheets)[number];

  const signedByPath = new Map<string, string>();
  if (sheets.length) {
    const { data: signed } = await supabase.storage
      .from("cheatsheets")
      .createSignedUrls(
        sheets.map((s) => s.file_path),
        60 * 60,
      );
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl);
    }
  }

  const byTerm = new Map<string, { sortKey: number; sheets: Sheet[] }>();
  for (const sheet of sheets) {
    const term = formatTerm(sheet.created_at);
    const time = new Date(sheet.created_at).getTime();
    const entry = byTerm.get(term) ?? { sortKey: time, sheets: [] };
    entry.sortKey = Math.max(entry.sortKey, time);
    entry.sheets.push(sheet);
    byTerm.set(term, entry);
  }
  const terms = [...byTerm.entries()].sort((a, b) => b[1].sortKey - a[1].sortKey);

  const assessments = getAssessments(code);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/cheatsheets" className="text-sm text-indigo-600 hover:text-indigo-700">
        ← All modules
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-mono text-2xl font-bold text-indigo-700">{code}</h1>
        <span className="text-gray-500">{subject?.title ?? "Module"}</span>
      </div>

      <div className="mt-6">
        <CheatsheetUpload moduleCode={code} assessments={assessments} userId={user!.id} />
      </div>

      <div className="mt-10 space-y-8">
        {terms.length === 0 ? (
          <p className="text-sm text-gray-500">No cheatsheets for {code} yet. Upload the first one.</p>
        ) : (
          terms.map(([term, group]) => {
            const byTest = new Map<string, Sheet[]>();
            for (const sheet of group.sheets) {
              const list = byTest.get(sheet.test_label) ?? [];
              list.push(sheet);
              byTest.set(sheet.test_label, list);
            }
            const tests = [...byTest.entries()].sort(
              (a, b) => assessmentRank(code, a[0]) - assessmentRank(code, b[0]) || a[0].localeCompare(b[0]),
            );

            return (
              <section key={term}>
                <h2 className="text-lg font-bold text-gray-900">{term}</h2>
                <div className="mt-3 space-y-5">
                  {tests.map(([test, testSheets]) => (
                    <div key={test}>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {test}
                      </h3>
                      <ul className="mt-2 space-y-2">
                        {testSheets.map((sheet) => {
                          const uploader = Array.isArray(sheet.uploader)
                            ? sheet.uploader[0]
                            : sheet.uploader;
                          const url = signedByPath.get(sheet.file_path);
                          return (
                            <li
                              key={sheet.id}
                              className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-soft"
                            >
                              <div className="min-w-0">
                                {url ? (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block truncate font-medium text-indigo-700 hover:text-indigo-800"
                                  >
                                    {sheet.title}
                                  </a>
                                ) : (
                                  <span className="block truncate font-medium text-gray-900">
                                    {sheet.title}
                                  </span>
                                )}
                                <p className="text-xs text-gray-400">
                                  {uploader?.full_name?.trim() || "A student"}
                                </p>
                              </div>
                              {sheet.uploader_id === user!.id && (
                                <DeleteCheatsheetButton id={sheet.id} />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CheatsheetModulePicker from "@/app/components/cheatsheet/CheatsheetModulePicker";

export default async function CheatsheetsPage() {
  const supabase = await createClient();

  const { data: subjectRows } = await supabase
    .from("subjects")
    .select("module_code, title")
    .order("module_code");
  const modules = (subjectRows ?? []).map((s) => ({ code: s.module_code, title: s.title }));
  const titleByCode = new Map(modules.map((m) => [m.code, m.title]));

  const { data: sheetRows } = await supabase.from("cheatsheets").select("module_code");
  const counts = new Map<string, number>();
  for (const row of sheetRows ?? []) {
    counts.set(row.module_code, (counts.get(row.module_code) ?? 0) + 1);
  }
  const withSheets = [...counts.entries()]
    .map(([code, count]) => ({ code, count, title: titleByCode.get(code) ?? code }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Cheatsheets</h1>
      <p className="mt-1 text-sm text-gray-500">
        Pick a module to browse cheatsheets shared by other students, or upload your own.
      </p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-soft">
        <label className="mb-2 block text-sm font-semibold text-gray-900">Find a module</label>
        <CheatsheetModulePicker modules={modules} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">Modules with cheatsheets</h2>
        {withSheets.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No cheatsheets uploaded yet. Be the first.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {withSheets.map((m) => (
              <li key={m.code}>
                <Link
                  href={`/cheatsheets/${m.code}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-soft transition-colors hover:bg-indigo-50"
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="font-mono text-sm font-semibold text-indigo-700">{m.code}</span>
                    <span className="truncate text-sm text-gray-500">{m.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {m.count} sheet{m.count === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

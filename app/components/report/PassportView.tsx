export interface PassportReport {
  id: string;
  module_code: string;
  misconceptions: string;
  summary: string;
  created_at: string;
  subjects: { title: string } | null;
}

export default function PassportView({
  studentName,
  reports,
}: {
  studentName: string;
  reports: PassportReport[];
}) {
  if (reports.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
        No session reports yet. The Academic Passport fills in as sessions are completed.
      </p>
    );
  }

  const byModule = new Map<string, PassportReport[]>();
  for (const r of reports) {
    byModule.set(r.module_code, [...(byModule.get(r.module_code) ?? []), r]);
  }

  return (
    <div className="space-y-6">
      {[...byModule.entries()].map(([moduleCode, items]) => (
        <section key={moduleCode}>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-indigo-700">{moduleCode}</span>
            <span className="text-xs text-gray-400">{items[0].subjects?.title}</span>
          </div>
          <ul className="space-y-3">
            {items.map((r) => (
              <li key={r.id} className="rounded-2xl bg-white shadow-soft p-5">
                <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold text-gray-900">Misconceptions: </span>
                  <span className="text-gray-600">{r.misconceptions}</span>
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold text-gray-900">Summary: </span>
                  <span className="text-gray-600">{r.summary}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-center text-xs text-gray-400">{studentName}&apos;s Academic Passport</p>
    </div>
  );
}

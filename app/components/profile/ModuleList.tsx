import TranscriptUpload from "./TranscriptUpload";

export interface ProfileModule {
  id: string;
  module_code: string;
  grade: string;
  completed_at: string;
  is_verified: boolean;
  transcript_path: string | null;
  subjects: { title: string } | null;
}

export default function ModuleList({
  modules,
  userId,
}: {
  modules: ProfileModule[];
  userId: string;
}) {
  if (modules.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
        No modules yet. Add a module you scored well in to start tutoring it.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-soft">
      {modules.map((m) => (
        <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-indigo-700">{m.module_code}</span>
              <span className="text-xs font-bold text-emerald-600">{m.grade}</span>
              {m.is_verified ? (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Verified
                </span>
              ) : (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Pending
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {m.subjects?.title} · completed {m.completed_at}
              {m.transcript_path && " · transcript attached"}
            </p>
          </div>
          {!m.is_verified && (
            <TranscriptUpload moduleId={m.id} moduleCode={m.module_code} userId={userId} />
          )}
        </li>
      ))}
    </ul>
  );
}

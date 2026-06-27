import type { TutorModule } from "./ModuleList";

export default function VerifiedModuleList({ modules }: { modules: TutorModule[] }) {
  // empty state
  if (modules.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-sm text-indigo-900/60">
        No verified modules yet. Approved modules will appear here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-indigo-100/80 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-white ring-1 ring-indigo-100 shadow-soft">
      {modules.map((m) => (
        <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-base font-bold text-indigo-700">{m.module_code}</span>
            <span className="text-base font-medium text-indigo-950">{m.subjects?.title}</span>
          </div>
          <span className="text-sm font-medium text-indigo-900/60">
            {m.reviewed_at
              ? `Verified on ${new Date(m.reviewed_at).toLocaleDateString([], { dateStyle: "medium" })}`
              : "Verified"}
          </span>
        </li>
      ))}
    </ul>
  );
}

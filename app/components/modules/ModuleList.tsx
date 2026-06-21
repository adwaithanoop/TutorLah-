import TranscriptUpload from "./TranscriptUpload";
import { formatTerm } from "@/lib/modules/terms";

export interface TutorModule {
  id: string;
  module_code: string;
  grade: string;
  completed_at: string;
  is_verified: boolean;
  verification_status: "pending" | "verified" | "rejected";
  review_note: string | null;
  reviewed_at: string | null;
  allow_resubmit: boolean;
  transcript_path: string | null;
  subjects: { title: string } | null;
}

const STATUS_BADGE: Record<TutorModule["verification_status"], { label: string; className: string }> = {
  verified: { label: "Verified", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejected", className: "bg-rose-50 text-rose-700" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700" },
};

export default function ModuleList({
  modules,
  userId,
}: {
  modules: TutorModule[];
  userId: string;
}) {
  if (modules.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
        No modules awaiting verification. Add one below to start tutoring it.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-soft">
      {modules.map((m) => {
        const badge = STATUS_BADGE[m.verification_status];
        const blocked = m.verification_status === "rejected" && !m.allow_resubmit;
        const canResubmit = m.verification_status === "pending" || (m.verification_status === "rejected" && m.allow_resubmit);
        return (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-indigo-700">{m.module_code}</span>
                <span className="text-xs font-bold text-emerald-600">{m.grade}</span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {m.subjects?.title} {formatTerm(m.completed_at)}
              </p>
              {m.verification_status === "rejected" && m.review_note && (
                <p className="mt-1 text-xs text-rose-600">Reviewer note: {m.review_note}</p>
              )}
              {blocked && (
                <p className="mt-1 text-xs text-rose-600">This module was rejected and cannot be resubmitted.</p>
              )}
            </div>
            {canResubmit ? (
              <TranscriptUpload
                moduleId={m.id}
                moduleCode={m.module_code}
                userId={userId}
                hasTranscript={Boolean(m.transcript_path)}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

import type { RankedTutor } from "@/lib/tutors/search";

function scoreStyle(score: number): string {
  if (score >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 80) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-orange-600 bg-orange-50 border-orange-200";
}

export default function TutorResultCard({ tutor }: { tutor: RankedTutor }) {
  return (
    <div className="flex flex-col rounded-xl bg-white shadow-soft p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${tutor.avatarColor} shadow-md`}
          >
            <span className="font-bold text-white">{tutor.initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-gray-900">{tutor.name}</h3>
              {tutor.isVerified && (
                <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified" role="img">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {[tutor.year, tutor.faculty].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <span className={`rounded-lg border px-2 py-1 text-sm font-bold ${scoreStyle(tutor.reliabilityScore)}`}>
          {tutor.reliabilityScore}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
          {tutor.moduleCode}
          <span className="font-normal text-indigo-400">·</span>
          <span className={tutor.grade === "A+" ? "text-emerald-600" : "text-indigo-600"}>{tutor.grade}</span>
        </span>
        <span className="text-xs text-gray-400">{tutor.sessionsCompleted} sessions · {tutor.reviewCount} reviews</span>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${tutor.isActive ? "animate-pulse bg-emerald-400" : "bg-gray-300"}`} />
          <span className={`text-xs font-medium ${tutor.isActive ? "text-emerald-600" : "text-gray-400"}`}>
            {tutor.isActive ? "Available now" : "Offline"}
          </span>
        </div>
        <span className="text-lg font-black text-gray-900">
          ${tutor.ratePerHour}
          <span className="text-sm font-normal text-gray-400">/hr</span>
        </span>
      </div>

      <a
        href={`/bookings/new?tutor=${tutor.id}&module=${tutor.moduleCode}`}
        className="mt-4 block rounded-full bg-indigo-600 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
      >
        Book a session
      </a>
    </div>
  );
}

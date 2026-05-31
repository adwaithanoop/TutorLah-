import { Star, BadgeCheck, ArrowRight } from "lucide-react";
import { mockTutors, type Tutor } from "../lib/mockData";

function ReliabilityScoreRing({ score }: { score: number }) {
  const isHigh = score >= 90;
  const isMid = score >= 80 && score < 90;

  const color = isHigh
    ? "text-emerald-600"
    : isMid
      ? "text-amber-600"
      : "text-orange-600";
  const bg = isHigh
    ? "bg-emerald-50 border-emerald-200"
    : isMid
      ? "bg-amber-50 border-amber-200"
      : "bg-orange-50 border-orange-200";

  return (
    <div
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 ${bg}`}
    >
      <span className={`text-lg font-black ${color}`}>{score}</span>
      <span className={`text-xs font-bold ${color} opacity-60`}>score</span>
    </div>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      ))}
      <span className="text-xs text-indigo-900/50 ml-1">({count})</span>
    </div>
  );
}

function TutorCard({ tutor }: { tutor: Tutor }) {
  return (
    <div className="flex flex-col rounded-xl bg-white p-6 shadow-soft-lg sm:p-7">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${tutor.avatarColor} shadow-soft`}>
            <span className="font-bold text-white">{tutor.initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-indigo-950">{tutor.name}</h3>
              <BadgeCheck className="h-4 w-4 text-indigo-600" aria-label="Verified tutor" />
            </div>
            <p className="text-sm text-indigo-900/60">
              {tutor.year} · {tutor.faculty}
            </p>
          </div>
        </div>
        <ReliabilityScoreRing score={tutor.reliabilityScore} />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {tutor.modules.map((m) => (
          <span
            key={m.code}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700"
          >
            {m.code}
            <span className="font-normal text-indigo-400">·</span>
            <span className={m.grade === "A+" ? "text-emerald-600" : "text-indigo-600"}>
              {m.grade}
            </span>
          </span>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-4 border-b border-indigo-100 pb-4">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-indigo-950">
            {tutor.sessionsCompleted}
          </span>
          <span className="text-xs text-indigo-900/40">sessions</span>
        </div>
        <div className="h-8 w-px bg-indigo-100" />
        <div className="flex flex-col">
          <StarRating count={tutor.reviewCount} />
          <span className="mt-0.5 text-xs text-indigo-900/40">
            {tutor.reviewCount} reviews
          </span>
        </div>
        <div className="ml-auto flex items-baseline gap-0.5">
          <span className="text-xl font-black text-indigo-950">
            ${tutor.ratePerHour}
          </span>
          <span className="text-sm text-indigo-900/40">/hr</span>
        </div>
      </div>

      <blockquote className="mb-4 flex-1 line-clamp-2 text-sm italic leading-relaxed text-indigo-900/60">
        &ldquo;{tutor.latestReview}&rdquo;
      </blockquote>

      <div className="mt-auto flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${tutor.isActive ? "animate-pulse bg-emerald-400" : "bg-gray-300"}`} />
        <span className={`text-xs font-medium ${tutor.isActive ? "text-emerald-600" : "text-indigo-900/40"}`}>
          {tutor.isActive ? "Available now" : "Offline"}
        </span>
      </div>
    </div>
  );
}

export default function TutorShowcase() {
  return (
    <section id="tutors" className="bg-cream py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Top Tutors
            </span>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-indigo-950 sm:text-4xl lg:text-5xl">
              Browse this week&apos;s top tutors
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-indigo-900/70">
              Every tutor is verified against their NUS transcript. Reliability
              Scores update in real-time after each session.
            </p>
          </div>
          <a
            href="/tutors"
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
          >
            Browse all tutors
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </a>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-white p-6 shadow-soft-lg sm:p-8">
          <p className="mb-1 text-sm font-semibold text-indigo-950">
            How is the Reliability Score calculated?
          </p>
          <p className="text-sm leading-relaxed text-indigo-900/70">
            The score is a weighted composite of 5 factors: student
            satisfaction ratings (30%), session completion rate (25%),
            transcript verification status (20%), module grade achieved (15%),
            and recency of module completion (10%). It updates after every
            completed session.
          </p>
        </div>
      </div>
    </section>
  );
}

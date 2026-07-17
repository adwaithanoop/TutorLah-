"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Star, CalendarCheck, BadgeCheck, GraduationCap, Clock, type LucideIcon } from "lucide-react";
import type { ScoreBreakdownEntry, ScoreComponentKey } from "@/lib/scoring/reliability";

function scoreStyle(score: number): string {
  if (score >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 80) return "text-amber-800 bg-amber-50 border-amber-200";
  return "text-orange-700 bg-orange-50 border-orange-200";
}

const COMPONENTS: Record<ScoreComponentKey, { label: string; icon: LucideIcon }> = {
  satisfaction: { label: "Student satisfaction", icon: Star },
  completion: { label: "Session completion", icon: CalendarCheck },
  verification: { label: "Transcript verification", icon: BadgeCheck },
  grade: { label: "Module grade", icon: GraduationCap },
  recency: { label: "Module recency", icon: Clock },
};

function ScoreDetails({
  id,
  score,
  breakdown,
}: {
  id: string;
  score: number;
  breakdown: ScoreBreakdownEntry[];
}) {
  return (
    <div
      id={id}
      role="region"
      aria-label="Reliability score breakdown"
      className="absolute right-0 z-10 mt-2 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-indigo-100 bg-white p-4 shadow-soft-lg"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Reliability Score</p>
        <span className="text-sm font-bold text-indigo-700">{score}</span>
      </div>
      <ul className="space-y-2">
        {breakdown.map((entry) => {
          const { label, icon: Icon } = COMPONENTS[entry.key];
          return (
            <li key={entry.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs text-gray-600">
                <Icon className="h-3.5 w-3.5 text-indigo-500" strokeWidth={2} />
                {label}
              </span>
              <span className="text-xs font-semibold text-gray-900">
                {entry.earned.toFixed(1)} / {entry.max}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
        A weighted composite of 5 factors, updated after every completed session.
      </p>
    </div>
  );
}

export default function ScoreBadge({ score, breakdown }: { score: number; breakdown: ScoreBreakdownEntry[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const detailsId = useId();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div
      className="relative"
      ref={ref}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Reliability score ${score}. Show score breakdown`}
        aria-expanded={open}
        aria-controls={detailsId}
        className={`rounded-lg border px-2 py-1 text-sm font-bold ${scoreStyle(score)}`}
      >
        {score}
      </button>
      {open && <ScoreDetails id={detailsId} score={score} breakdown={breakdown} />}
    </div>
  );
}

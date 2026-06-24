"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, X, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatSgtDateTime, formatSgtTime, formatSgtDayLabel, countdownLabel } from "@/lib/scheduling/display";

export interface RequestView {
  id: string;
  moduleCode: string;
  tutorName: string;
  start: string;
  end: string;
  amount: number;
  status: string;
  expiresAt: string;
}

export interface OfferView {
  id: string;
  moduleCode: string;
  tutorName: string;
  amount: number;
  expiresAt: string;
  slots: { start: string; end: string }[];
}

interface Affordability {
  balance: number;
  committed: number;
  shortfall: number;
}

const STATUS: Record<string, { label: string; className: string }> = {
  accepted: { label: "Booked", className: "bg-emerald-100 text-emerald-700" },
  declined: { label: "Declined", className: "bg-gray-100 text-gray-500" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-500" },
  superseded: { label: "Replaced", className: "bg-gray-100 text-gray-500" },
  countered: { label: "Countered", className: "bg-amber-100 text-amber-700" },
};

export default function RequestsDashboard({
  userId,
  requests,
  offers,
  affordability,
}: {
  userId: string;
  requests: RequestView[];
  offers: OfferView[];
  affordability: Affordability;
}) {
  const router = useRouter();
  const [, setTick] = useState(0);
  const [error, setError] = useState("");

  // Live countdown: re-render once a second so the timers tick. Purely cosmetic.
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Push: when a tutor accepts, declines, counters, or a sweep expires a row, refresh so
  // the screen reflects it without a manual reload.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`requests-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_requests", filter: `student_id=eq.${userId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "counter_offers", filter: `student_id=eq.${userId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, userId]);

  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending");

  async function cancel(id: string) {
    setError("");
    const res = await fetch(`/api/booking-requests/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    if (!res.ok) setError((await res.json()).error ?? "Could not cancel");
    else router.refresh();
  }

  async function acceptOffer(offerId: string, start: string, end: string) {
    setError("");
    const res = await fetch(`/api/counter-offers/${offerId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scheduled_start: start, scheduled_end: end }),
    });
    if (res.ok) {
      router.push("/bookings");
      return;
    }
    const data = await res.json();
    setError(data.message ?? data.error ?? "Could not confirm");
  }

  return (
    <div className="space-y-6">
      {affordability.shortfall > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm text-amber-800">
            <Wallet className="h-4 w-4" />
            Your live requests could cost ${affordability.committed.toFixed(2)} but your balance is $
            {affordability.balance.toFixed(2)}. Top up ${affordability.shortfall.toFixed(2)} so a tutor can accept.
          </p>
          <Link
            href="/wallet"
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
          >
            Top up
          </Link>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {offers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Counter offers</h2>
          {offers.map((o) => (
            <div key={o.id} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-semibold text-indigo-700">{o.moduleCode}</span>
                  <span className="ml-2 text-sm text-gray-600">{o.tutorName} offered new times</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                  <Clock className="h-3.5 w-3.5" />
                  {countdownLabel(o.expiresAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Tap a time to confirm and pay ${o.amount.toFixed(2)}.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {o.slots.map((s) => (
                  <button
                    key={s.start}
                    onClick={() => acceptOffer(o.id, s.start, s.end)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    {formatSgtDayLabel(s.start)}, {formatSgtTime(s.start)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Waiting on tutors</h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            No requests waiting. Find a module to book from search.
          </p>
        ) : (
          pending.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-soft">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-indigo-700">{r.moduleCode}</span>
                  <span className="text-sm text-gray-600">{r.tutorName}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formatSgtDateTime(r.start)} to {formatSgtTime(r.end)} · ${r.amount.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  {countdownLabel(r.expiresAt)}
                </span>
                <button
                  onClick={() => cancel(r.id)}
                  aria-label="Cancel request"
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:border-red-200 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {history.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">History</h2>
          {history.map((r) => {
            const meta = STATUS[r.status] ?? { label: r.status, className: "bg-gray-100 text-gray-500" };
            return (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-white px-5 py-3 shadow-soft">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono font-semibold text-indigo-700">{r.moduleCode}</span>
                  <span className="text-gray-500">{r.tutorName}</span>
                  <span className="text-xs text-gray-400">{formatSgtDateTime(r.start)}</span>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

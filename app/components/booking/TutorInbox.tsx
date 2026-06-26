"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Check, X, CornerUpLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slotsForDuration, sgtDateKey, type SlotOption } from "@/lib/scheduling/slots";
import { formatSgtDateTime, formatSgtTime, formatSgtDayLabel, countdownLabel } from "@/lib/scheduling/display";

export interface IncomingRequest {
  id: string;
  moduleCode: string;
  studentId: string;
  studentName: string;
  start: string;
  end: string;
  amount: number;
  status: string;
  expiresAt: string;
}

interface GroupSlot {
  id: string;
  start: string;
  end: string;
  amount: number;
}

interface RequestGroup {
  key: string;
  studentName: string;
  moduleCode: string;
  durationMin: number;
  soonestExpiry: string;
  slots: GroupSlot[];
}

const MIN_MS = 60_000;
const HEADERS = { "content-type": "application/json" };

const STATUS: Record<string, { label: string; className: string }> = {
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700" },
  declined: { label: "Declined", className: "bg-gray-100 text-gray-500" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-500" },
  superseded: { label: "Closed", className: "bg-gray-100 text-gray-500" },
  countered: { label: "Countered", className: "bg-amber-100 text-amber-700" },
};

// Collapses a student's many slots for one module into a single request, so a blast of
// times does not flood the inbox as separate cards.
function groupRequests(pending: IncomingRequest[]): RequestGroup[] {
  const map = new Map<string, RequestGroup>();
  for (const r of pending) {
    const key = `${r.studentId}|${r.moduleCode}`;
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        studentName: r.studentName,
        moduleCode: r.moduleCode,
        durationMin: (Date.parse(r.end) - Date.parse(r.start)) / MIN_MS,
        soonestExpiry: r.expiresAt,
        slots: [],
      };
      map.set(key, group);
    }
    group.slots.push({ id: r.id, start: r.start, end: r.end, amount: r.amount });
    if (Date.parse(r.expiresAt) < Date.parse(group.soonestExpiry)) group.soonestExpiry = r.expiresAt;
  }
  for (const group of map.values()) {
    group.slots.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  }
  return [...map.values()].sort((a, b) => Date.parse(a.soonestExpiry) - Date.parse(b.soonestExpiry));
}

export default function TutorInbox({
  userId,
  requests,
  freeWindows,
}: {
  userId: string;
  requests: IncomingRequest[];
  freeWindows: { start: string; end: string }[];
}) {
  const router = useRouter();
  const [, setTick] = useState(0);
  const [error, setError] = useState("");
  const [countering, setCountering] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, SlotOption>>({});
  const [openDay, setOpenDay] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_requests", filter: `tutor_id=eq.${userId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, userId]);

  const intervals = useMemo(
    () => freeWindows.map((w) => ({ start: new Date(w.start), end: new Date(w.end) })),
    [freeWindows],
  );

  const groups = useMemo(() => groupRequests(requests.filter((r) => r.status === "pending")), [requests]);
  const history = requests.filter((r) => r.status !== "pending");

  async function accept(id: string) {
    setError("");
    const res = await fetch(`/api/booking-requests/${id}`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ action: "accept" }),
    });
    if (!res.ok) setError((await res.json()).error ?? "Could not accept");
    else router.refresh();
  }

  // Declining a group closes every slot the student offered for that module. Only the first
  // slot notifies the student, so one "decline all" sends one alert, not one per slot.
  async function declineGroup(group: RequestGroup) {
    setError("");
    const results = await Promise.all(
      group.slots.map((s, i) =>
        fetch(`/api/booking-requests/${s.id}`, {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify({ action: "decline", silent: i > 0 }),
        }),
      ),
    );
    if (results.some((r) => !r.ok)) setError("Some requests could not be declined");
    router.refresh();
  }

  function openCounter(group: RequestGroup) {
    setError("");
    setChosen({});
    setOpenDay("");
    setCountering(countering === group.key ? null : group.key);
  }

  function toggleSlot(slot: SlotOption) {
    setChosen((prev) => {
      const next = { ...prev };
      if (next[slot.start]) delete next[slot.start];
      else if (Object.keys(next).length < 3) next[slot.start] = slot;
      return next;
    });
  }

  // Countering replaces the student's whole module ask: one slot carries the counter-offer,
  // the rest are closed so they do not linger after the student has new times to pick from.
  async function sendCounter(group: RequestGroup) {
    const slots = Object.values(chosen);
    if (slots.length === 0) {
      setError("Pick at least one alternative time");
      return;
    }
    setError("");
    const [first, ...rest] = group.slots.map((s) => s.id);
    const res = await fetch(`/api/booking-requests/${first}/counter`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ slots: slots.map((s) => ({ scheduled_start: s.start, scheduled_end: s.end })) }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not send counter-offer");
      return;
    }
    await Promise.all(
      rest.map((id) =>
        fetch(`/api/booking-requests/${id}`, {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify({ action: "decline", silent: true }),
        }),
      ),
    );
    setCountering(null);
    router.refresh();
  }

  // The tutor's free slots, matched to the group's duration, grouped by day.
  function counterDays(group: RequestGroup) {
    const slots = slotsForDuration(intervals, group.durationMin);
    const byDay = new Map<string, SlotOption[]>();
    for (const slot of slots) {
      const key = sgtDateKey(slot.start);
      const list = byDay.get(key) ?? [];
      list.push(slot);
      byDay.set(key, list);
    }
    return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="space-y-3">
        {groups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            No requests waiting. Keep your weekly availability current so students can find you.
          </p>
        ) : (
          groups.map((group) => {
            const days = countering === group.key ? counterDays(group) : [];
            return (
              <div key={group.key} className="rounded-2xl bg-white p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-indigo-700">{group.moduleCode}</span>
                      <span className="text-sm text-gray-600">{group.studentName}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {group.slots.length === 1
                        ? "Requested 1 time"
                        : `Requested ${group.slots.length} times, accept one`}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {countdownLabel(group.soonestExpiry)}
                  </span>
                </div>

                <ul className="mt-3 divide-y divide-gray-100">
                  {group.slots.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700">
                        {formatSgtDateTime(s.start)} to {formatSgtTime(s.end)}
                        <span className="ml-2 text-xs text-gray-400">${s.amount.toFixed(2)}</span>
                      </span>
                      <button
                        onClick={() => accept(s.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        <Check className="h-3.5 w-3.5" /> Accept
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openCounter(group)}
                    className="inline-flex items-center gap-1 rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    <CornerUpLeft className="h-4 w-4" /> Counter
                  </button>
                  <button
                    onClick={() => declineGroup(group)}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" /> Decline all
                  </button>
                </div>

                {countering === group.key && (
                  <div className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                    <p className="text-xs font-semibold text-gray-600">
                      Offer up to three other times you are free (same length). The student confirms one and it books
                      instantly; their other requests for this module close.
                    </p>
                    {days.length === 0 ? (
                      <p className="text-sm text-gray-400">No other matching slots in your availability.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {days.map(([key]) => (
                            <button
                              key={key}
                              onClick={() => setOpenDay(openDay === key ? "" : key)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                                openDay === key
                                  ? "border-indigo-500 bg-white text-indigo-700"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                              }`}
                            >
                              {formatSgtDayLabel(key)}
                            </button>
                          ))}
                        </div>
                        {openDay && (
                          <div className="flex flex-wrap gap-2">
                            {(days.find(([k]) => k === openDay)?.[1] ?? []).map((slot) => {
                              const on = !!chosen[slot.start];
                              return (
                                <button
                                  key={slot.start}
                                  onClick={() => toggleSlot(slot)}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                    on ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                                  }`}
                                >
                                  {formatSgtTime(slot.start)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <button
                          onClick={() => sendCounter(group)}
                          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                          Send offer ({Object.keys(chosen).length})
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
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
                  <span className="text-gray-500">{r.studentName}</span>
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

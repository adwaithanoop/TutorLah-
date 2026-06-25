"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Check, Send } from "lucide-react";
import { slotsForDuration, sgtDateKey, type SlotOption } from "@/lib/scheduling/slots";
import { formatSgtTime, formatSgtDayLabel, durationLabel } from "@/lib/scheduling/display";

interface TutorOption {
  id: string;
  name: string;
  ratePerHour: number;
  windows: { start: string; end: string }[];
}

interface Picked {
  tutorId: string;
  tutorName: string;
  start: string;
  end: string;
  price: number;
}

const DURATIONS = [60, 90, 120, 150, 180] as const;

function priceFor(rate: number, durationMin: number): number {
  return Math.round((rate * durationMin) / 60 * 100) / 100;
}

export default function BlastBuilder({
  moduleCode,
  tutors,
  balance,
}: {
  moduleCode: string;
  tutors: TutorOption[];
  balance: number;
}) {
  const router = useRouter();
  const [duration, setDuration] = useState<number>(60);
  const [openDay, setOpenDay] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<Record<string, Picked>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Per tutor, the duration's bookable days mapped to their start-time options. Recomputed
  // only when the duration changes, so switching length is instant.
  const dayedTutors = useMemo(() => {
    return tutors.map((t) => {
      const intervals = t.windows.map((w) => ({ start: new Date(w.start), end: new Date(w.end) }));
      const slots = slotsForDuration(intervals, duration);
      const byDay = new Map<string, SlotOption[]>();
      for (const slot of slots) {
        const key = sgtDateKey(slot.start);
        const list = byDay.get(key) ?? [];
        list.push(slot);
        byDay.set(key, list);
      }
      return { tutor: t, days: [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])) };
    });
  }, [tutors, duration]);

  const selected = Object.values(picked);
  const maxPrice = selected.reduce((m, s) => Math.max(m, s.price), 0);
  const tutorCount = new Set(selected.map((s) => s.tutorId)).size;

  function toggle(tutor: TutorOption, slot: SlotOption) {
    const key = `${tutor.id}|${slot.start}`;
    setPicked((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else
        next[key] = {
          tutorId: tutor.id,
          tutorName: tutor.name,
          start: slot.start,
          end: slot.end,
          price: priceFor(tutor.ratePerHour, duration),
        };
      return next;
    });
  }

  async function send() {
    setError("");
    setBusy(true);
    const res = await fetch("/api/booking-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requests: selected.map((s) => ({
          tutor_id: s.tutorId,
          module_code: moduleCode,
          scheduled_start: s.start,
          scheduled_end: s.end,
        })),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not send your requests");
      return;
    }
    router.push("/bookings/requests");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-soft">
        <p className="mb-2 text-sm font-semibold text-gray-700">Session length</p>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                duration === d ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {durationLabel(d)}
            </button>
          ))}
        </div>
      </div>

      {tutors.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          No tutors are available for {moduleCode} yet.
        </p>
      ) : (
        <div className="space-y-4">
          {dayedTutors.map(({ tutor, days }) => (
            <div key={tutor.id} className="rounded-2xl bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{tutor.name}</p>
                  <p className="text-xs text-gray-500">
                    Rate: ${tutor.ratePerHour}/hr
                    <br />
                    Total: ${priceFor(tutor.ratePerHour, duration)} for {durationLabel(duration)}
                  </p>
                </div>
              </div>

              {days.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">No {durationLabel(duration)} slots in the next two weeks.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {days.map(([key]) => (
                      <button
                        key={key}
                        onClick={() => setOpenDay((p) => ({ ...p, [tutor.id]: p[tutor.id] === key ? "" : key }))}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                          openDay[tutor.id] === key
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-700 hover:border-indigo-300"
                        }`}
                      >
                        {formatSgtDayLabel(key)}
                      </button>
                    ))}
                  </div>

                  {openDay[tutor.id] &&
                    (() => {
                      const slots = days.find(([k]) => k === openDay[tutor.id])?.[1] ?? [];
                      return (
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot) => {
                            const key = `${tutor.id}|${slot.start}`;
                            const on = !!picked[key];
                            return (
                              <button
                                key={key}
                                onClick={() => toggle(tutor, slot)}
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                  on ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {on && <Check className="h-3.5 w-3.5" />}
                                {formatSgtTime(slot.start)}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="sticky bottom-4 rounded-2xl border border-indigo-100 bg-white p-5 shadow-soft">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{selected.length}</span> {selected.length === 1 ? "request" : "requests"} across{" "}
            <span className="font-semibold">{tutorCount}</span> {tutorCount === 1 ? "tutor" : "tutors"}. You pay once, for
            whoever accepts first.
          </p>
          {balance < maxPrice && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-700">
              <Clock className="h-4 w-4" />
              Your balance is ${balance.toFixed(2)}. Some of these cost up to ${maxPrice.toFixed(2)} {" "}
              <Link href="/wallet" className="font-semibold underline">
                top up
              </Link>{" "}
              so a tutor can accept.
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={send}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {busy ? "Sending..." : `Send ${selected.length} ${selected.length === 1 ? "request" : "requests"}`}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  WEEKDAY_LABELS,
  WEEKDAY_SHORT,
  gridMarks,
  minuteToLabel,
  durationLabel,
} from "@/lib/scheduling/display";

export interface WeeklyBlock {
  id: string;
  weekday: number;
  start_minute: number;
  end_minute: number;
}

// block length limits in minutes
const MIN_BLOCK = 60;
const MAX_BLOCK = 180;
const DAY_END = 1440;
const MAX_BLOCK_END = DAY_END - 30 + MAX_BLOCK;

// A block must start before midnight, but it can finish after midnight.
const LATEST_START = DAY_END - 30;

export default function WeeklyAvailabilityEditor({ blocks }: { blocks: WeeklyBlock[] }) {
  const router = useRouter();
  // new block form state
  const [weekday, setWeekday] = useState(1);
  const [startMinute, setStartMinute] = useState(16 * 60);
  const [endMinute, setEndMinute] = useState(18 * 60);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // selectable start times
  const startMarks = useMemo(() => gridMarks().filter((m) => m.value <= LATEST_START), []);

  // The end can only be 1 to 3 hours after the start in half-hour steps.
  const endChoices = useMemo(
    () => [60, 90, 120, 150, 180].map((d) => startMinute + d).filter((v) => v <= MAX_BLOCK_END),
    [startMinute],
  );

  // keep the duration when the start time moves
  function changeStart(value: number) {
    const duration = Math.min(MAX_BLOCK, Math.max(MIN_BLOCK, endMinute - startMinute));
    setStartMinute(value);
    setEndMinute(Math.min(MAX_BLOCK_END, value + duration));
  }

  // existing blocks grouped by weekday
  const byDay = useMemo(() => {
    const grouped = new Map<number, WeeklyBlock[]>();
    for (const b of blocks) {
      const list = grouped.get(b.weekday) ?? [];
      list.push(b);
      grouped.set(b.weekday, list);
    }
    for (const list of grouped.values()) list.sort((a, b) => a.start_minute - b.start_minute);
    return grouped;
  }, [blocks]);

  // add a block
  async function add(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const duration = endMinute - startMinute;
    if (duration < MIN_BLOCK || duration > MAX_BLOCK) {
      setError("A block must be between 1 and 3 hours long");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/availability/blocks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ weekday, start_minute: startMinute, end_minute: endMinute }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not add this block");
      return;
    }
    router.refresh();
  }

  // delete a block
  async function remove(id: string) {
    await fetch(`/api/availability/blocks?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-5 rounded-2xl bg-white p-6 shadow-soft">
      <div>
        <h2 className="font-bold text-gray-900">Weekly booking slots</h2>
        <p className="text-sm text-gray-500">
          Add the weekly times students can book you. Each block is a bookable window from 1 to 3
          hours, and students pick a session length that fits inside it. Existing bookings are not
          changed.
        </p>
      </div>

      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Day</span>
          <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className={input}>
            {WEEKDAY_LABELS.map((label, value) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">From</span>
          <select value={startMinute} onChange={(e) => changeStart(Number(e.target.value))} className={input}>
            {startMarks.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">To</span>
          <select value={endMinute} onChange={(e) => setEndMinute(Number(e.target.value))} className={input}>
            {endChoices.map((v) => (
              <option key={v} value={v}>
                {minuteToLabel(v)} ({durationLabel(v - startMinute)})
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Add block
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {WEEKDAY_LABELS.map((label, value) => {
          const list = byDay.get(value) ?? [];
          return (
            <div key={value} className="rounded-xl border border-gray-100 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {WEEKDAY_SHORT[value]}
              </p>
              {list.length === 0 ? (
                <p className="text-sm text-gray-300">Not available</p>
              ) : (
                <ul className="space-y-1.5">
                  {list.map((b) => (
                    <li key={b.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {minuteToLabel(b.start_minute)} to {minuteToLabel(b.end_minute)}
                      </span>
                      <button
                        onClick={() => remove(b.id)}
                        aria-label="Remove block"
                        className="text-gray-300 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// shared select styling
const input =
  "rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

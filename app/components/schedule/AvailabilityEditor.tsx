"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface Slot {
  id: string;
  starts_at: string;
  ends_at: string;
  kind: string;
}

export default function AvailabilityEditor({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [kind, setKind] = useState<"fixed" | "flexible">("flexible");
  const [error, setError] = useState("");

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString(), kind }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not add slot");
      return;
    }
    setStart("");
    setEnd("");
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/availability?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white shadow-soft p-6">
      <div>
        <h2 className="font-bold text-gray-900">One-off slots for chat proposals</h2>
        <p className="text-sm text-gray-500">
          Specific dates used only to suggest a mutual time when you propose a session in chat. These
          are not bookable. To take bookings, set your weekly hours above.
        </p>
      </div>
      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">From</span>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required className={input} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">To</span>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required className={input} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Kind</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as "fixed" | "flexible")} className={input}>
            <option value="flexible">Flexible</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
        <button type="submit" className="rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          Add
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-gray-100">
        {slots.length === 0 && <li className="py-2 text-sm text-gray-400">No availability added yet.</li>}
        {slots.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-gray-700">
              {new Date(s.starts_at).toLocaleString()} → {new Date(s.ends_at).toLocaleTimeString()}{" "}
              <span className="text-xs text-gray-400">({s.kind})</span>
            </span>
            <button onClick={() => remove(s.id)} className="text-xs font-medium text-red-600 hover:text-red-700">
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const input =
  "rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

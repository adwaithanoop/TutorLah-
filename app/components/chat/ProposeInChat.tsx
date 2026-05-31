"use client";

import { useState } from "react";

interface Slot {
  start: string;
  end: string;
}

export default function ProposeInChat({ otherId }: { otherId: string }) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function propose() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/availability/propose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ other_id: otherId }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not find slots");
      return;
    }
    setSlots(data.slots);
  }

  return (
    <div className="rounded-2xl bg-white shadow-soft p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Propose a session</span>
        <button
          onClick={propose}
          disabled={busy}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {busy ? "Checking…" : "Find mutual slots"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {slots && (
        <div className="mt-3 flex flex-wrap gap-2">
          {slots.length === 0 ? (
            <p className="text-xs text-gray-400">No mutual free slots: update your availability.</p>
          ) : (
            slots.map((s) => (
              <span
                key={`${s.start}-${s.end}`}
                className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700"
              >
                {new Date(s.start).toLocaleString()} → {new Date(s.end).toLocaleTimeString()}
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}

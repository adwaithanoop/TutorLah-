"use client";

import { useState } from "react";

interface Proposed {
  start: string;
  end: string;
}

export default function ProposeSession() {
  const [otherId, setOtherId] = useState("");
  const [slots, setSlots] = useState<Proposed[] | null>(null);
  const [otherName, setOtherName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function propose(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSlots(null);
    const res = await fetch("/api/availability/propose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ other_id: otherId.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not find slots");
      return;
    }
    setOtherName(data.otherName);
    setSlots(data.slots);
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white shadow-soft p-6">
      <h2 className="font-bold text-gray-900">Propose a session</h2>
      <form onSubmit={propose} className="flex items-end gap-3">
        <label className="flex-1">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Other user&apos;s id</span>
          <input
            value={otherId}
            onChange={(e) => setOtherId(e.target.value)}
            placeholder="paste their profile id"
            required
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 font-mono text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        <button type="submit" className="rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          Find slots
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {slots && (
        <div>
          <p className="mb-2 text-sm text-gray-500">
            {slots.length === 0 ? `No mutual free slots with ${otherName}.` : `Mutual free time with ${otherName}:`}
          </p>
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => {
              const key = `${s.start}-${s.end}`;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selected === key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {new Date(s.start).toLocaleString()} → {new Date(s.end).toLocaleTimeString()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateGroupForm() {
  const router = useRouter();
  // form fields
  const [moduleCode, setModuleCode] = useState("");
  const [title, setTitle] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [floor, setFloor] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // create the session, then clear the form
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        module_code: moduleCode,
        title,
        total_cost: Number(totalCost),
        max_participants: Number(maxParticipants),
        floor_per_student: Number(floor),
        scheduled_start: start ? new Date(start).toISOString() : "",
        scheduled_end: end ? new Date(end).toISOString() : "",
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not create group session");
      return;
    }
    setModuleCode("");
    setTitle("");
    setTotalCost("");
    setMaxParticipants("");
    setFloor("");
    setStart("");
    setEnd("");
    router.refresh();
  }

  // shared input styling
  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
      <h2 className="font-bold text-gray-900">Host a group session</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Session title"
        required
        className={inputClass}
      />
      <input
        value={moduleCode}
        onChange={(e) => setModuleCode(e.target.value)}
        placeholder="Module code (e.g. CS2040S)"
        required
        className={`${inputClass} font-mono uppercase`}
      />
      <div className="grid grid-cols-3 gap-3">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={totalCost}
          onChange={(e) => setTotalCost(e.target.value)}
          placeholder="Total cost"
          required
          className={inputClass}
        />
        <input
          type="number"
          min="1"
          max="100"
          step="1"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(e.target.value)}
          placeholder="Max seats"
          required
          className={inputClass}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          placeholder="Floor / student"
          required
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-gray-600">
          Starts
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Ends
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create session"}
      </button>
    </form>
  );
}

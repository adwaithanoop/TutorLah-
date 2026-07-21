"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModuleCombobox, { type ModuleOption } from "@/app/components/ModuleCombobox";

export default function CreateLobbyForm({ modules }: { modules: ModuleOption[] }) {
  const router = useRouter();
  // form fields
  const [moduleCode, setModuleCode] = useState("");
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [minParticipants, setMinParticipants] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // create the lobby, then clear the form
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!moduleCode) {
      setError("Pick a module from the list");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/lobbies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        module_code: moduleCode,
        title,
        budget: Number(budget),
        min_participants: Number(minParticipants),
        max_participants: Number(maxParticipants),
        scheduled_start: start ? new Date(start).toISOString() : "",
        scheduled_end: end ? new Date(end).toISOString() : "",
        deadline: deadline ? new Date(deadline).toISOString() : "",
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not create lobby");
      return;
    }
    setModuleCode("");
    setTitle("");
    setBudget("");
    setMinParticipants("");
    setMaxParticipants("");
    setStart("");
    setEnd("");
    setDeadline("");
    setResetKey((k) => k + 1);
    router.refresh();
  }

  // shared input styling
  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
      <h2 className="font-bold text-gray-900">Start a study lobby</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Lobby title"
        required
        className={inputClass}
      />
      <ModuleCombobox
        key={resetKey}
        modules={modules}
        onChange={setModuleCode}
        placeholder="Search a module - code or title"
      />
      <div className="grid grid-cols-3 gap-3">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Budget"
          required
          className={inputClass}
        />
        <input
          type="number"
          min="2"
          max="100"
          step="1"
          value={minParticipants}
          onChange={(e) => setMinParticipants(e.target.value)}
          placeholder="Min seats"
          required
          className={inputClass}
        />
        <input
          type="number"
          min="2"
          max="100"
          step="1"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(e.target.value)}
          placeholder="Max seats"
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
      <label className="block text-xs font-medium text-gray-600">
        Fill-by deadline
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
          className={`mt-1 ${inputClass}`}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || !moduleCode}
        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create lobby"}
      </button>
    </form>
  );
}

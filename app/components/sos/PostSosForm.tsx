"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PostSosForm() {
  const router = useRouter();
  const [moduleCode, setModuleCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/sos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ module_code: moduleCode, description }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not post SOS");
      return;
    }
    setModuleCode("");
    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
      <h2 className="font-bold text-gray-900">Post an SOS</h2>
      <input
        value={moduleCode}
        onChange={(e) => setModuleCode(e.target.value)}
        placeholder="Module code (e.g. CS1231S)"
        required
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 font-mono text-sm uppercase focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What are you stuck on? Be specific so tutors can bid quickly."
        rows={3}
        required
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
      >
        {busy ? "Broadcasting…" : "Broadcast SOS"}
      </button>
    </form>
  );
}

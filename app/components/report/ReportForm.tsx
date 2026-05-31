"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [misconceptions, setMisconceptions] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId, misconceptions, summary }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not submit report");
      return;
    }
    router.push("/bookings");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white shadow-soft p-6">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">Identified misconceptions</span>
        <textarea
          value={misconceptions}
          onChange={(e) => setMisconceptions(e.target.value)}
          rows={3}
          required
          placeholder="e.g. Confused base case vs recursive case; struggled to reason about call-stack depth."
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">Session summary &amp; next steps</span>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          required
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}

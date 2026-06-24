"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { formatSgtDateTime } from "@/lib/scheduling/display";

export default function ReportForm({
  bookingId,
  scheduledEnd,
}: {
  bookingId: string;
  scheduledEnd: string;
}) {
  const router = useRouter();
  const [misconceptions, setMisconceptions] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // The session end is the authority on the server; this client check only governs what
  // the form lets you do, and ticks so the button unlocks the moment the session ends.
  const ended = now >= Date.parse(scheduledEnd);
  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [ended]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!ended) return;
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
      {!ended && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            You can write the report now, but it can only be submitted after the session ends on{" "}
            {formatSgtDateTime(scheduledEnd)}.
          </span>
        </div>
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">Identified misconceptions</span>
        <textarea
          value={misconceptions}
          onChange={(e) => setMisconceptions(e.target.value)}
          rows={3}
          required
          placeholder="e.g. Confused between iterative and recursive processes, confusion with box and pointer diagram. [elaborate]"
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
          placeholder="e.g. Covered double integration and its applications in depth, test double integration in polar coords before moving on to next chapter ODE. "
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || !ended}
        title={ended ? undefined : "Available after the session ends"}
        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600"
      >
        {ended ? (busy ? "Submitting..." : "Submit report") : "Submit after session ends"}
      </button>
    </form>
  );
}

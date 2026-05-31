"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BidForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [rate, setRate] = useState(20);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/sos/${requestId}/bids`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rate: Number(rate) }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not bid");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <span className="text-sm text-gray-500">$</span>
      <input
        type="number"
        min={1}
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <span className="text-sm text-gray-500">/hr</span>
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {busy ? "Bidding…" : "Submit bid"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

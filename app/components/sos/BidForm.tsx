"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BidForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  // bid state
  const [amount, setAmount] = useState(30);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // submit a bid
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/sos/${requestId}/bids`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: Number(amount) }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not bid");
      return;
    }
    setSubmitted(true);
    router.refresh();
  }

  // already bid
  if (submitted) {
    return (
      <p className="text-sm font-semibold text-emerald-600">
        Bid submitted. Waiting for the student to choose.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-gray-500">Your total offer</label>
      <span className="text-sm text-gray-500">$</span>
      <input
        type="number"
        min={1}
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
      />
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

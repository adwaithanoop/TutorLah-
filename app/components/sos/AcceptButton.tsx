"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptButton({
  requestId,
  bidId,
  amount,
}: {
  requestId: string;
  bidId: string;
  amount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const formattedAmount = amount.toFixed(2);

  async function accept() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/sos/${requestId}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bid_id: bidId }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not accept");
      return;
    }
    router.push("/bookings");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={accept}
        disabled={busy}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {busy ? "Accepting…" : `Accept (hold $${formattedAmount})`}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Event = "pay" | "complete" | "cancel" | "refund";

export default function BookingActions({
  bookingId,
  escrowState,
  reportSubmitted,
  amount,
  role,
}: {
  bookingId: string;
  escrowState: string;
  reportSubmitted: boolean;
  amount: number;
  role: "student" | "tutor";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsTopUp, setNeedsTopUp] = useState(false);

  async function fire(event: Event) {
    setBusy(true);
    setError("");
    setNeedsTopUp(false);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event }),
    });
    setBusy(false);
    if (!res.ok) {
      const message = (await res.json()).error ?? "Action failed";
      if (event === "pay" && /insufficient/i.test(message)) {
        setNeedsTopUp(true);
        return;
      }
      setError(message);
      return;
    }
    router.refresh();
  }

  const actions: Array<{ event: Event; label: string; primary?: boolean }> = [];
  const showReportLink = escrowState === "held" && role === "tutor" && !reportSubmitted;
  if (escrowState === "pending_payment" && role === "student") {
    actions.push({ event: "pay", label: "Pay now", primary: true }, { event: "cancel", label: "Cancel" });
  }
  if (escrowState === "held") {
    if (role === "tutor") {
      actions.push({ event: "complete", label: "Mark complete", primary: reportSubmitted });
    }
    actions.push({ event: "refund", label: "Request refund" });
  }

  const showReviewLink = escrowState === "released" && role === "student";
  if (actions.length === 0 && !showReportLink && !showReviewLink) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showReportLink && (
        <Link
          href={`/reports/new?booking=${bookingId}`}
          className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          Submit report
        </Link>
      )}
      {showReviewLink && (
        <Link
          href={`/reviews/new?booking=${bookingId}`}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Leave a review
        </Link>
      )}
      {actions.map((a) => (
        <button
          key={a.event}
          onClick={() => fire(a.event)}
          disabled={busy}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            a.primary
              ? "bg-indigo-600 text-white hover:bg-indigo-500"
              : "border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {a.label}
        </button>
      ))}
      {needsTopUp && (
        <Link
          href={`/wallet?need=${amount}`}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400"
        >
          Top up to pay
        </Link>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

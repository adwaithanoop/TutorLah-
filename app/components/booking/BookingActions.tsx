"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatSgtDateTime } from "@/lib/scheduling/display";

type Event = "pay" | "complete" | "cancel" | "refund";

export default function BookingActions({
  bookingId,
  escrowState,
  reportSubmitted,
  amount,
  role,
  scheduledEnd,
}: {
  bookingId: string;
  escrowState: string;
  reportSubmitted: boolean;
  amount: number;
  role: "student" | "tutor";
  scheduledEnd: string;
}) {
  const router = useRouter();
  // action state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsTopUp, setNeedsTopUp] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // The server is the authority on whether the session has ended; this only governs the
  // button's look and ticks so it unlocks the moment the session is over.
  const sessionEnded = now >= Date.parse(scheduledEnd);
  useEffect(() => {
    if (sessionEnded) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [sessionEnded]);

  // run a booking action (pay, complete, cancel, refund)
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

  // build the button list for the current escrow state and role
  const actions: Array<{ event: Event; label: string; primary?: boolean; locked?: boolean }> = [];
  const showReportLink = escrowState === "held" && role === "tutor" && !reportSubmitted;
  if (escrowState === "pending_payment" && role === "student") {
    actions.push({ event: "pay", label: "Pay now", primary: true }, { event: "cancel", label: "Cancel" });
  }
  if (escrowState === "held") {
    if (role === "tutor") {
      // Completing releases payment, so it stays locked until the session has actually
      // ended; the server enforces the same against its own clock.
      actions.push({
        event: "complete",
        label: sessionEnded ? "Mark complete" : "Mark complete",
        primary: reportSubmitted && sessionEnded,
        locked: !sessionEnded,
      });
    }
    actions.push({ event: "refund", label: "Request refund" });
  }

  const showReviewLink = escrowState === "released" && role === "student";
  if (actions.length === 0 && !showReportLink && !showReviewLink) return null;

  const completeLocked = role === "tutor" && escrowState === "held" && !sessionEnded;

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
          disabled={busy || a.locked}
          title={a.locked ? "Available after the session ends" : undefined}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            a.primary
              ? "bg-indigo-600 text-white hover:bg-indigo-500"
              : "border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {a.label}
        </button>
      ))}
      {completeLocked && (
        <span className="text-xs text-gray-400">Unlocks when the session ends ({formatSgtDateTime(scheduledEnd)})</span>
      )}
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

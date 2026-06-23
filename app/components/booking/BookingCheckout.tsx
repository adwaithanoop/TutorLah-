"use client";

import { useState } from "react";
import Link from "next/link";
import { suggestTopUp } from "@/lib/wallet/money";
import TimeCombobox from "@/app/components/booking/TimeCombobox";

const PRESETS = [10, 20, 50, 100];

type Step = "details" | "review";

export interface CheckoutDraft {
  step: Step;
  date: string;
  startTime: string;
  endTime: string;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatDuration(hours: number): string {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// Combines the chosen date and start time into a local Date, or null if either is missing.
function startDateOf(date: string, startTime: string): Date | null {
  if (!date || !startTime) return null;
  const d = new Date(`${date}T${startTime}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function BookingCheckout({
  tutorId,
  tutorName,
  moduleCode,
  defaultRate,
  balance: initialBalance,
  initial,
  topupResult,
}: {
  tutorId: string;
  tutorName: string;
  moduleCode: string;
  defaultRate: number;
  balance: number;
  initial?: CheckoutDraft;
  topupResult?: "success" | "cancelled" | null;
}) {
  const [step, setStep] = useState<Step>(initial?.step ?? "details");
  const [date, setDate] = useState(initial?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");

  const [balance, setBalance] = useState(initialBalance);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("20");
  const [topupError, setTopupError] = useState("");

  const notice =
    topupResult === "success"
      ? "Top-up received. You can complete your booking below."
      : topupResult === "cancelled"
        ? "Top-up cancelled. Nothing was charged."
        : "";

  // The wallet is credited by the Stripe webhook, which can land a moment after a
  // top-up, so the freshest balance is fetched right when the user goes to pay.
  async function refreshBalance(): Promise<number> {
    const res = await fetch("/api/wallet/balance");
    if (!res.ok) return balance;
    const data = await res.json();
    setBalance(data.balance);
    return data.balance;
  }

  function computeCost(): { cost: number | null; error: string | null } {
    const startD = startDateOf(date, startTime);
    const endD = startDateOf(date, endTime);
    if (!startD || !endD) return { cost: null, error: "Choose a date, start and end time" };
    const hours = (endD.getTime() - startD.getTime()) / 3_600_000;
    if (hours <= 0) return { cost: null, error: "End time must be after the start time" };
    if (!(defaultRate > 0)) return { cost: null, error: "This tutor has not set a rate yet" };
    return { cost: round2(defaultRate * hours), error: null };
  }

  const cost = computeCost().cost ?? 0;
  const startDate = startDateOf(date, startTime);
  const endDate = startDateOf(date, endTime);
  const durationHours =
    startDate && endDate ? (endDate.getTime() - startDate.getTime()) / 3_600_000 : 0;

  function bookingPayload() {
    return {
      tutor_id: tutorId,
      module_code: moduleCode,
      scheduled_start: startDate!.toISOString(),
      scheduled_end: endDate!.toISOString(),
    };
  }

  function onConfirm(event: React.FormEvent) {
    event.preventDefault();
    const { cost: c, error: e } = computeCost();
    if (c == null) {
      setError(e ?? "Check your inputs");
      return;
    }
    setError("");
    setStep("review");
  }

  async function onMakePayment() {
    const { cost: c, error: e } = computeCost();
    if (c == null) {
      setError(e ?? "Check your inputs");
      return;
    }
    setError("");
    setBusy(true);
    const fresh = await refreshBalance();
    setBusy(false);
    if (fresh >= c) {
      setPayOpen(true);
    } else {
      setTopupAmount(Math.max(suggestTopUp(c, fresh), 1).toFixed(2));
      setTopupError("");
      setTopupOpen(true);
    }
  }

  async function doPay() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(bookingPayload()),
    });
    const data = await res.json();
    setBusy(false);

    if (res.status === 402) {
      setPayOpen(false);
      setBalance(data.balance ?? balance);
      setTopupAmount(Math.max(Number(data.shortfall) || 1, 1).toFixed(2));
      setTopupError("");
      setTopupOpen(true);
      return;
    }
    if (!res.ok) {
      setPayOpen(false);
      setError(data.error ?? "Payment failed");
      return;
    }
    setPayOpen(false);
    setBooked(true);
  }

  async function doTopUp() {
    const amt = Number(topupAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setTopupError("Enter a valid amount");
      return;
    }
    setBusy(true);
    setTopupError("");
    const draft = new URLSearchParams({
      tutor: tutorId,
      module: moduleCode,
      resume: "1",
      date,
      startTime,
      endTime,
    });
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: amt, redirect: `/bookings/new?${draft.toString()}` }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setBusy(false);
      setTopupError(data.error ?? "Could not start top-up");
      return;
    }
    window.location.href = data.url;
  }

  if (booked) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
          ✓
        </div>
        <h2 className="text-xl font-bold text-gray-900">Session booked and paid</h2>
        <p className="mt-1 text-sm text-gray-500">
          Your ${cost.toFixed(2)} payment is held until the session is complete, then paid to{" "}
          {tutorName}.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/bookings"
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            View bookings
          </Link>
          <Link
            href={`/messages/${tutorId}`}
            className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Message {tutorName}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {notice && (
        <p className="mb-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{notice}</p>
      )}

      {step === "details" ? (
        <form onSubmit={onConfirm} className="space-y-5 rounded-2xl bg-white shadow-soft p-6">
          <p className="text-sm text-gray-500">
            Booking <span className="font-semibold text-gray-900">{tutorName}</span> for{" "}
            <span className="font-mono font-semibold text-indigo-600">{moduleCode}</span>
          </p>

          <Labeled label="Rate per hour">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700">
              ${defaultRate.toFixed(2)}
            </div>
          </Labeled>

          <Labeled label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={input}
            />
          </Labeled>

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Start time">
              <TimeCombobox value={startTime} onChange={setStartTime} className={input} />
            </Labeled>
            <Labeled label="End time">
              <TimeCombobox value={endTime} onChange={setEndTime} className={input} />
            </Labeled>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Confirm
          </button>
        </form>
      ) : (
        <div className="space-y-5 rounded-2xl bg-white shadow-soft p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Review and pay</h2>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Edit
            </button>
          </div>

          <dl className="space-y-2 text-sm">
            <Row label="Tutor" value={tutorName} />
            <Row label="Module" value={moduleCode} />
            <Row
              label="When"
              value={
                startDate && endDate
                  ? `${startDate.toLocaleString()} - ${endDate.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })} (${formatDuration(durationHours)})`
                  : "-"
              }
            />
            <Row label="Rate" value={`$${defaultRate.toFixed(2)}/hr`} />
          </dl>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm font-medium text-gray-500">Total</span>
            <span className="text-2xl font-black text-gray-900">${cost.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-400">Wallet balance: ${balance.toFixed(2)}</p>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={onMakePayment}
            disabled={busy}
            className="w-full rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Checking balance..." : "Make payment"}
          </button>
        </div>
      )}

      {payOpen && (
        <Modal onClose={() => !busy && setPayOpen(false)}>
          <h3 className="text-lg font-bold text-gray-900">Confirm payment</h3>
          <p className="mt-2 text-sm text-gray-500">
            Pay <span className="font-semibold text-gray-900">${cost.toFixed(2)}</span> from your
            wallet for this session. It is held until the session is complete, then paid to{" "}
            {tutorName}.
          </p>
          <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Balance now</span>
              <span className="font-semibold text-gray-900">${balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">After payment</span>
              <span className="font-semibold text-gray-900">${(balance - cost).toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setPayOpen(false)}
              disabled={busy}
              className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={doPay}
              disabled={busy}
              className="flex-1 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy ? "Processing..." : "Confirm payment"}
            </button>
          </div>
        </Modal>
      )}

      {topupOpen && (
        <Modal onClose={() => !busy && setTopupOpen(false)}>
          <h3 className="text-lg font-bold text-gray-900">Top up to continue</h3>
          <p className="mt-2 text-sm text-gray-500">
            This session costs <span className="font-semibold text-gray-900">${cost.toFixed(2)}</span>{" "}
            but your balance is ${balance.toFixed(2)}. Add funds to finish booking.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTopupAmount(preset.toFixed(2))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                ${preset}
              </button>
            ))}
          </div>
          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              $
            </span>
            <input
              inputMode="decimal"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-6 pr-3 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          {topupError && <p className="mt-2 text-xs text-red-600">{topupError}</p>}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setTopupOpen(false)}
              disabled={busy}
              className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={doTopUp}
              disabled={busy}
              className="flex-1 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy ? "Redirecting..." : "Top up"}
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Card and PayNow via Stripe. You return here to finish booking once payment clears.
          </p>
        </Modal>
      )}
    </>
  );
}

const input =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

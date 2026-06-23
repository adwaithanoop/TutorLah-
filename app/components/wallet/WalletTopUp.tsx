"use client";

import { useState } from "react";

const PRESETS = [10, 20, 50, 100];

export default function WalletTopUp({ suggested = 0 }: { suggested?: number }) {
  const [amount, setAmount] = useState(suggested > 0 ? suggested.toFixed(2) : "20");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function topUp() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: value }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setBusy(false);
      setError(data.error ?? "Could not start checkout");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <h2 className="text-sm font-semibold text-gray-900">Top up your wallet</h2>
      {suggested > 0 && (
        <p className="mt-1 text-xs text-indigo-700">
          You need ${suggested.toFixed(2)} more to cover that booking.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset.toFixed(2))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ${preset}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            $
          </span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32 rounded-lg border border-gray-200 py-1.5 pl-6 pr-3 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <button
          onClick={topUp}
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? "Redirecting..." : "Top up"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-gray-400">
        Card and PayNow are processed by Stripe. Your balance updates once payment clears.
      </p>
    </div>
  );
}

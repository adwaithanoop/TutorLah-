"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookingForm({
  tutorId,
  tutorName,
  moduleCode,
  defaultRate,
}: {
  tutorId: string;
  tutorName: string;
  moduleCode: string;
  defaultRate: number;
}) {
  const router = useRouter();
  const [priceType, setPriceType] = useState<"fixed" | "negotiable">("fixed");
  const [rate, setRate] = useState(defaultRate || 25);
  const [agreed, setAgreed] = useState(defaultRate || 25);
  const [min, setMin] = useState(10);
  const [max, setMax] = useState(60);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      tutor_id: tutorId,
      module_code: moduleCode,
      scheduled_start: new Date(start).toISOString(),
      scheduled_end: new Date(end).toISOString(),
      price_type: priceType,
      ...(priceType === "fixed" ? { rate_per_hour: Number(rate) } : { agreed: Number(agreed), min: Number(min), max: Number(max) }),
    };
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not create booking");
      return;
    }
    router.push("/bookings");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white shadow-soft p-6">
      <p className="text-sm text-gray-500">
        Booking <span className="font-semibold text-gray-900">{tutorName}</span> for{" "}
        <span className="font-mono font-semibold text-indigo-600">{moduleCode}</span>
      </p>

      <div className="flex gap-2">
        {(["fixed", "negotiable"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setPriceType(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              priceType === t ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {priceType === "fixed" ? (
        <Labeled label="Rate per hour (SGD)">
          <input type="number" min={1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className={input} />
        </Labeled>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Labeled label="Agreed"><input type="number" value={agreed} onChange={(e) => setAgreed(Number(e.target.value))} className={input} /></Labeled>
          <Labeled label="Min"><input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} className={input} /></Labeled>
          <Labeled label="Max"><input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} className={input} /></Labeled>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Labeled label="Start"><input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required className={input} /></Labeled>
        <Labeled label="End"><input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required className={input} /></Labeled>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
        {busy ? "Creating…" : "Create booking"}
      </button>
    </form>
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

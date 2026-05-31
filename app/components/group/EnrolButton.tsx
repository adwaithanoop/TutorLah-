"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnrolButton({ groupId, disabled }: { groupId: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [price, setPrice] = useState<number | null>(null);

  async function enrol() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/groups/${groupId}/enrol`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not enrol");
      return;
    }
    setPrice((await res.json()).price_charged);
    router.refresh();
  }

  if (price !== null) {
    return <span className="text-xs font-semibold text-emerald-600">Enrolled at ${price}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={enrol}
        disabled={busy || disabled}
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {busy ? "Enrolling…" : "Enrol"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

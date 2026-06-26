"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResolveButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function resolve() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/sos/${requestId}/cancel`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not resolve");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={resolve}
        disabled={busy}
        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
      >
        {busy ? "Resolving…" : "Mark resolved"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

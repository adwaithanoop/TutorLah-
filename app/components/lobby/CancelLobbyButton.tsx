"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelLobbyButton({ lobbyId }: { lobbyId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [armed, setArmed] = useState(false);

  // close the lobby before anyone else joins
  async function cancel() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch(`/api/lobbies/${lobbyId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setArmed(false);
      setError((await res.json()).error ?? "Could not cancel");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={cancel}
        disabled={busy}
        className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {busy ? "Cancelling…" : armed ? "Confirm cancel" : "Cancel lobby"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

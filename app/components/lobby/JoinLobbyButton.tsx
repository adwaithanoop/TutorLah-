"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinLobbyButton({ lobbyId, disabled }: { lobbyId: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);

  // grab a seat and refresh the head count
  async function join() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/lobbies/${lobbyId}/join`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not join");
      return;
    }
    setJoined(true);
    router.refresh();
  }

  if (joined) {
    return <span className="text-xs font-semibold text-emerald-600">Joined</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={join}
        disabled={busy || disabled}
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {busy ? "Joining…" : "Join"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

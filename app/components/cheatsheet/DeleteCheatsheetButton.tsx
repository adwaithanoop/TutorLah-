"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCheatsheetButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this cheatsheet?")) return;
    setBusy(true);
    const res = await fetch("/api/cheatsheets", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="ml-3 shrink-0 text-xs font-medium text-gray-400 hover:text-red-600 disabled:opacity-60"
    >
      {busy ? "…" : "Delete"}
    </button>
  );
}

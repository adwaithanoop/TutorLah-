"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewActions({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function submit(approve: boolean, reviewNote?: string) {
    setStatus("working");
    setError("");
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ module_id: moduleId, approve, note: reviewNote }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Action failed");
      setStatus("error");
      return;
    }
    router.refresh();
  }

  if (rejecting) {
    return (
      <div className="w-full max-w-xs">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Reason (optional, shown to the tutor)"
          className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-indigo-400 focus:outline-none"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => submit(false, note.trim() || undefined)}
            disabled={status === "working"}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            Confirm reject
          </button>
          <button
            onClick={() => setRejecting(false)}
            disabled={status === "working"}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        {status === "error" && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          onClick={() => submit(true)}
          disabled={status === "working"}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => setRejecting(true)}
          disabled={status === "working"}
          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {status === "error" && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

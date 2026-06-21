"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewActions({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [allowResubmit, setAllowResubmit] = useState(true);
  const [error, setError] = useState("");

  async function submit(approve: boolean, opts?: { note?: string; allowResubmit?: boolean }) {
    setStatus("working");
    setError("");
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        module_id: moduleId,
        approve,
        note: opts?.note,
        allow_resubmit: opts?.allowResubmit,
      }),
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
          placeholder={"Please insert reason here. This is visible to tutor."}
          className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-indigo-400 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-gray-600">
            {allowResubmit ? "File error: need to re-upload" : "Reject: grade too low"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={!allowResubmit}
            onClick={() => setAllowResubmit((v) => !v)}
            disabled={status === "working"}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              allowResubmit ? "bg-gray-300" : "bg-rose-500"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                allowResubmit ? "translate-x-1" : "translate-x-5"
              }`}
            />
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => submit(false, { note: note.trim() || undefined, allowResubmit })}
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

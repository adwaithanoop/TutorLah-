"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "working" | "ready" | "error";

export default function ConnectTelegram({
  connected,
  username,
}: {
  connected: boolean;
  username: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  // start the telegram link flow and get a deep link
  async function handleConnect() {
    setStatus("working");
    setError("");
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      if (!res.ok) {
        setError((await res.json()).error ?? "Could not start linking");
        setStatus("error");
        return;
      }
      const { url } = await res.json();
      setLinkUrl(url);
      setStatus("ready");
    } catch {
      setError("Could not start linking. Try again.");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-soft p-6">
      <h2 className="text-lg font-semibold text-gray-900">Telegram alerts</h2>
      <p className="mt-1 text-sm text-gray-500">
        Link Telegram to get a direct message the moment a student posts an SOS for a module you
        tutor, with a link to bid.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {linkUrl ? (
          <>
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Open Telegram
            </a>
            <button
              type="button"
              onClick={() => {
                setLinkUrl(null);
                setStatus("idle");
                router.refresh();
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              I have linked it
            </button>
          </>
        ) : connected ? (
          <>
            <span className="text-sm font-medium text-emerald-600">
              Telegram connected{username ? ` as @${username}` : ""}
            </span>
            <button
              type="button"
              onClick={handleConnect}
              disabled={status === "working"}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Reconnect
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={status === "working"}
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {status === "working" ? "Connecting…" : "Connect Telegram"}
          </button>
        )}
      </div>

      {linkUrl && (
        <p className="mt-2 text-xs text-gray-400">Press Start in Telegram, then tap I have linked it.</p>
      )}
      {status === "error" && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

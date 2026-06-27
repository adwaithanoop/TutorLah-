"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const APPLE_EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

// toggle switch
function Switch({
  checked,
  onToggle,
  disabled,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${APPLE_EASE} focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${APPLE_EASE} ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function AvailabilityToggle({
  initialActive,
  initialReceivingSos,
}: {
  initialActive: boolean;
  initialReceivingSos: boolean;
}) {
  const router = useRouter();
  // local toggle state, kept in sync with the server
  const [active, setActive] = useState(initialActive);
  const [receivingSos, setReceivingSos] = useState(initialReceivingSos);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // save a toggle change, revert on failure
  async function patch(
    payload: { is_active?: boolean; receiving_sos?: boolean },
    revert: () => void,
  ) {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/profile/availability", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        revert();
        setError(data.error ?? "Could not update");
        return;
      }
      router.refresh();
    } catch {
      revert();
      setError("Could not update");
    } finally {
      setPending(false);
    }
  }

  // flip availability
  function toggleActive() {
    if (pending) return;
    const next = !active;
    setActive(next);
    void patch({ is_active: next }, () => setActive(!next));
  }

  // flip sos receiving
  function toggleSos() {
    if (pending) return;
    const next = !receivingSos;
    setReceivingSos(next);
    void patch({ receiving_sos: next }, () => setReceivingSos(!next));
  }

  return (
    <div className="w-64 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-indigo-100">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
          <span className={active ? "text-emerald-700" : "text-gray-500"}>
            {active ? "Available" : "Unavailable"}
          </span>
        </span>
        <Switch checked={active} onToggle={toggleActive} disabled={pending} label="Available for sessions" />
      </div>

      <div
        aria-hidden={!active}
        className={`grid transition-all duration-300 ${APPLE_EASE} ${
          active ? "mt-3 grid-rows-[1fr] translate-y-0 opacity-100" : "mt-0 grid-rows-[0fr] -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-t border-indigo-50 pt-3">
            <span className="text-sm">
              <span className="font-medium text-indigo-950">Receiving SOS</span>
              <span className="mt-0.5 block text-xs text-indigo-900/50">Urgent requests for your modules</span>
            </span>
            <Switch
              checked={receivingSos}
              onToggle={toggleSos}
              disabled={pending || !active}
              label="Receiving SOS"
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

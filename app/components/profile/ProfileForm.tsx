"use client";

import { useState } from "react";
import { AVATAR_COLORS } from "@/lib/validation/profile";

export interface ProfileFields {
  full_name: string;
  faculty: string | null;
  year: string | null;
  rate_per_hour: number;
  avatar_color: string;
}

type Status = "idle" | "saving" | "saved" | "error";

export default function ProfileForm({ initial }: { initial: ProfileFields }) {
  const [form, setForm] = useState<ProfileFields>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function set<K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, rate_per_hour: Number(form.rate_per_hour) }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not save");
      setStatus("error");
      return;
    }
    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white shadow-soft p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Faculty">
          <input
            value={form.faculty ?? ""}
            onChange={(e) => set("faculty", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Year">
          <input
            value={form.year ?? ""}
            onChange={(e) => set("year", e.target.value)}
            placeholder="Year 2"
            className={inputClass}
          />
        </Field>
        <Field label="Rate per hour (SGD)">
          <input
            type="number"
            min={0}
            value={form.rate_per_hour}
            onChange={(e) => set("rate_per_hour", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700">Avatar colour</p>
        <div className="flex gap-2">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              onClick={() => set("avatar_color", color)}
              className={`h-8 w-8 rounded-full ${color} ${
                form.avatar_color === color ? "ring-2 ring-indigo-500 ring-offset-2" : ""
              }`}
            />
          ))}
        </div>
      </div>

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save profile"}
        </button>
        {status === "saved" && <span className="text-sm font-medium text-emerald-600">Saved</span>}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

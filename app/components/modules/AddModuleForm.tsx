"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GRADES } from "@/lib/validation/profile";
import { recentTerms } from "@/lib/modules/terms";
import { createClient } from "@/lib/supabase/client";

export default function AddModuleForm({ userId }: { userId: string }) {
  const router = useRouter();
  const terms = useMemo(() => recentTerms(), []);
  const fileInput = useRef<HTMLInputElement>(null);
  const [moduleCode, setModuleCode] = useState("");
  const [grade, setGrade] = useState<(typeof GRADES)[number]>("A+");
  const [completedAt, setCompletedAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Attach your transcript");
      return;
    }
    setSaving(true);
    setError("");

    const code = moduleCode.trim().toUpperCase();
    const path = `${userId}/${code}-${Date.now()}-${file.name}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("transcripts")
      .upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
      setSaving(false);
      return;
    }

    const res = await fetch("/api/profile/modules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ module_code: code, grade, completed_at: completedAt, transcript_path: path }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not add module");
      return;
    }
    setModuleCode("");
    setCompletedAt("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white shadow-soft p-6">
      <label className="flex-1">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">Module</span>
        <input
          value={moduleCode}
          onChange={(e) => setModuleCode(e.target.value)}
          placeholder="CS2040S"
          required
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 font-mono text-sm uppercase focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </label>
      <label>
        <span className="mb-1.5 block text-sm font-medium text-gray-700">Grade</span>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value as (typeof GRADES)[number])}
          className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1.5 block text-sm font-medium text-gray-700">Completed</span>
        <select
          value={completedAt}
          onChange={(e) => setCompletedAt(e.target.value)}
          required
          className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="" disabled>
            Select term
          </option>
          {terms.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1.5 block text-sm font-medium text-gray-700">Transcript</span>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {saving ? "Adding…" : "Add module"}
      </button>
      <p className="w-full text-xs text-gray-400">Verification of trancript may take up to 48 hours.</p>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CheatsheetUpload({
  moduleCode,
  assessments,
  userId,
}: {
  moduleCode: string;
  assessments: string[];
  userId: string;
}) {
  const router = useRouter();
  const [testLabel, setTestLabel] = useState(assessments[0] ?? "");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose a file to upload");
      return;
    }
    if (!testLabel) {
      setError("Pick which test this is for");
      return;
    }

    setBusy(true);
    setError("");

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/${moduleCode}/${Date.now()}-${safeName}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("cheatsheets")
      .upload(path, file, { upsert: false });
    if (uploadError) {
      setError(uploadError.message);
      setBusy(false);
      return;
    }

    const res = await fetch("/api/cheatsheets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        module_code: moduleCode,
        test_label: testLabel,
        title: title.trim() || file.name,
        file_path: path,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not save cheatsheet");
      return;
    }

    const form = event.currentTarget;
    setTitle("");
    setFile(null);
    setTestLabel(assessments[0] ?? "");
    form.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-indigo-100 bg-white p-6 shadow-soft"
    >
      <h2 className="font-bold text-gray-900">Upload a cheatsheet</h2>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Which test is it for?</label>
        <select
          value={testLabel}
          onChange={(e) => setTestLabel(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {assessments.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. One-page summary)"
        maxLength={120}
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || !file}
        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Share cheatsheet"}
      </button>
    </form>
  );
}

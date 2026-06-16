"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TranscriptUpload({
  moduleId,
  moduleCode,
  userId,
}: {
  moduleId: string;
  moduleCode: string;
  userId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError("");
    const path = `${userId}/${moduleCode}-${file.name}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("transcripts")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setError(uploadError.message);
      setStatus("error");
      return;
    }

    const res = await fetch("/api/profile/modules", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ module_id: moduleId, transcript_path: path }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not link transcript");
      setStatus("error");
      return;
    }
    setStatus("done");
    router.refresh();
  }

  return (
    <div className="text-xs">
      <label className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-700">
        {status === "uploading" ? "Uploading…" : "Upload transcript"}
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFile} className="hidden" />
      </label>
      <p className="mt-0.5 text-gray-400">Verification is manual; uploading does not verify you.</p>
      {status === "error" && <p className="mt-0.5 text-red-600">{error}</p>}
    </div>
  );
}

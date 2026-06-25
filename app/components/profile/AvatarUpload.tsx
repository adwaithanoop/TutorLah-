"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signedAvatarUrl } from "@/lib/avatars";
import Avatar from "@/app/components/Avatar";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type Status = "idle" | "uploading" | "done" | "error";

export default function AvatarUpload({
  userId,
  fullName,
  avatarColor,
  initialPath,
  initialUrl,
}: {
  userId: string;
  fullName: string;
  avatarColor: string;
  initialPath: string | null;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const [path, setPath] = useState<string | null>(initialPath);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function persist(nextPath: string | null) {
    const res = await fetch("/api/profile/avatar", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ avatar_path: nextPath }),
    });
    if (!res.ok) {
      throw new Error((await res.json()).error ?? "Could not save photo");
    }
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG, or WEBP image.");
      setStatus("error");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5 MB or smaller.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setError("");

    const supabase = createClient();
    const previous = path;
    const nextPath = `${userId}/${Date.now()}.${EXTENSIONS[file.type]}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(nextPath, file);
    if (uploadError) {
      setError(uploadError.message);
      setStatus("error");
      return;
    }

    try {
      await persist(nextPath);
    } catch (err) {
      await supabase.storage.from("avatars").remove([nextPath]);
      setError(err instanceof Error ? err.message : "Could not save photo");
      setStatus("error");
      return;
    }

    if (previous) await supabase.storage.from("avatars").remove([previous]);
    setPath(nextPath);
    setPreviewUrl(await signedAvatarUrl(supabase, nextPath));
    setStatus("done");
    router.refresh();
  }

  async function handleRemove() {
    if (!path) return;
    setStatus("uploading");
    setError("");
    const supabase = createClient();
    const previous = path;
    try {
      await persist(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove photo");
      setStatus("error");
      return;
    }
    await supabase.storage.from("avatars").remove([previous]);
    setPath(null);
    setPreviewUrl(null);
    setStatus("idle");
    router.refresh();
  }

  const busy = status === "uploading";

  return (
    <div className="rounded-2xl bg-white shadow-soft p-6">
      <div className="flex items-start gap-5">
        <Avatar
          src={previewUrl}
          name={fullName || "You"}
          colorClass={avatarColor}
          className="h-20 w-20 flex-shrink-0 shadow-md"
          textClass="text-xl"
        />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">Profile photo</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload a clear photo showing your full face. Photos that do not clearly show a face
            will be rejected. A valid photo is required to book sessions as a student and to tutor.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              {busy ? "Uploading…" : path ? "Replace photo" : "Upload photo"}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFile}
                disabled={busy}
                className="hidden"
              />
            </label>
            {path && !busy && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Remove photo
              </button>
            )}
            {status === "done" && (
              <span className="text-sm font-medium text-emerald-600">Photo saved</span>
            )}
          </div>

          <p className="mt-2 text-xs text-gray-400">JPG, PNG, or WEBP, up to 5 MB.</p>
          {status === "error" && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

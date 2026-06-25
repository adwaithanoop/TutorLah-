import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const BUCKET = "avatars";
const SIGNED_URL_TTL = 60 * 60;

type Client = SupabaseClient<Database>;

// The `avatars` bucket is private, so a face photo is never world-readable. Display
// happens through short-lived signed URLs minted for the current request, which any
// signed-in user can create but anonymous visitors cannot.
export async function signedAvatarUrl(
  supabase: Client,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

// One round trip for a list of paths (tutor search), keyed by path so callers can look
// each tutor's URL back up. Paths that fail to sign are simply omitted.
export async function signedAvatarUrls(
  supabase: Client,
  paths: (string | null | undefined)[],
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  if (unique.length === 0) return {};

  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(unique, SIGNED_URL_TTL);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

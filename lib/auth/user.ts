import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface CurrentUser {
  id: string;
  email: string | null;
}

export async function getCurrentUser(supabase: ServerClient): Promise<CurrentUser | null> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

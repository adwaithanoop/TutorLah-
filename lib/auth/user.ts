import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface CurrentUser {
  id: string;
  email: string | null;
}

export async function getCurrentUser(supabase: ServerClient): Promise<CurrentUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

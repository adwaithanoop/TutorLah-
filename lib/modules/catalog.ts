import { createAdminClient } from "@/lib/supabase/admin";

const NUSMODS_AY = process.env.NUSMODS_AY ?? "2024-2025";

export async function ensureModuleInCatalog(moduleCode: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("subjects")
    .select("module_code")
    .eq("module_code", moduleCode)
    .maybeSingle();
  if (existing) return true;

  const res = await fetch(
    `https://api.nusmods.com/v2/${NUSMODS_AY}/modules/${moduleCode}.json`,
  );
  if (!res.ok) return false;

  const detail = (await res.json()) as { title?: unknown };
  const title = typeof detail.title === "string" ? detail.title : moduleCode;

  const { error } = await admin
    .from("subjects")
    .upsert({ module_code: moduleCode, level: "nus", title }, { onConflict: "module_code" });
  return !error;
}

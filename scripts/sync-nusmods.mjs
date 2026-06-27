// Seeds the subjects table from the public NUSMods module list. Run it once to populate the subject catalog and again whenever a new academic year opens.
// node scripts/sync-nusmods.mjs
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ay = process.env.NUSMODS_AY ?? "2025-2026";

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const res = await fetch(`https://api.nusmods.com/v2/${ay}/moduleList.json`);
if (!res.ok) {
  console.error(`NUSMods fetch failed: ${res.status}`);
  process.exit(1);
}

const modules = await res.json();
const rows = modules.map((m) => ({ module_code: m.moduleCode, level: "nus", title: m.title }));

let synced = 0;
for (let i = 0; i < rows.length; i += 500) {
  const batch = rows.slice(i, i + 500);
  const { error } = await supabase.from("subjects").upsert(batch, { onConflict: "module_code" });
  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }
  synced += batch.length;
}

console.log(`Synced ${synced} NUS modules from AY ${ay}.`);

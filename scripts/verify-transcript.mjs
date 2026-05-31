import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const [ident, moduleArg, action] = process.argv.slice(2);
if (!ident || !moduleArg) {
  console.error("Usage: node scripts/verify-transcript.mjs <email|tutorId> <MODULE_CODE> [revoke]");
  process.exit(1);
}

const verify = action !== "revoke";
const moduleCode = moduleArg.toUpperCase();
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function resolveTutorId(value) {
  if (!value.includes("@")) return value;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === value.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 1000) return null;
  }
}

const tutorId = await resolveTutorId(ident);
if (!tutorId) {
  console.error(`No user found for ${ident}.`);
  process.exit(1);
}

const { data, error } = await supabase
  .from("tutor_modules")
  .update({ is_verified: verify })
  .eq("tutor_id", tutorId)
  .eq("module_code", moduleCode)
  .select();

if (error) {
  console.error(error.message);
  process.exit(1);
}
if (!data.length) {
  console.error(`No ${moduleCode} module on that tutor's profile, ask them to add it first.`);
  process.exit(1);
}

console.log(`${verify ? "Verified" : "Revoked"} ${moduleCode} for ${ident}.`);

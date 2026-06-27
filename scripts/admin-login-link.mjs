// generates a one-time login link for production to log into an account without waiting on the OTP email.
// node scripts/admin-login-link.mjs <email>
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function readKey() {
  for (const line of readFileSync(".env.prod.local", "utf8").split("\n")) {
    const match = line.match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)\s*$/);
    if (match) return match[1].replace(/^["']|["']$/g, "");
  }
  throw new Error("SUPABASE_SERVICE_ROLE_KEY not found in .env.prod.local");
}

const url = "https://onvovjbuijvxphpxkqsj.supabase.co";
const key = readKey();
const email = process.argv[2];
const next = process.argv[3] ?? "/dashboard";

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: node scripts/admin-login-link.mjs <email> [next-path]");
  console.error("Pass a valid email address to generate a login link for.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { redirectTo: `https://tutorlah.vercel.app/auth/confirm?next=${next}` },
});

if (error) {
  console.error(error.message);
  process.exit(1);
}
const hash = data.properties.hashed_token;
console.log(`https://tutorlah.vercel.app/auth/confirm?token_hash=${hash}&type=magiclink&next=${next}`);

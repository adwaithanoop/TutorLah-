import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const url = "https://onvovjbuijvxphpxkqsj.supabase.co";
const anon =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udm92amJ1aWp2eHBocHhrcXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzgyNzYsImV4cCI6MjA5NTMxNDI3Nn0.q7NI4opjdMrJq3Oaq_4bXcgsOiXbAzp7G6DBcHlU2uE";

function svcKey() {
  for (const line of readFileSync(".env.prod.local", "utf8").split("\n")) {
    const m = line.match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error("no key");
}

const admin = createClient(url, svcKey(), { auth: { persistSession: false } });
const email = "aiden@u.nus.edu";

async function tryType(type) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) return console.log(`generateLink failed: ${error.message}`);
  const otp = data.properties.email_otp;
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const r = await client.auth.verifyOtp({ email, token: otp, type });
  console.log(`type="${type}" otp=${otp} => ${r.error ? "FAIL: " + r.error.message : "SUCCESS (session=" + !!r.data.session + ")"}`);
}

await tryType("email");
await tryType("magiclink");

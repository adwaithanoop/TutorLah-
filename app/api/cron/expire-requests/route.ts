import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Materialises expiry for stale requests and counter-offers. Correctness already comes
// from the read filters that hide anything past its deadline; this just tidies state so
// expired rows leave the screen and stop counting against affordability. Vercel Cron
// calls it with the CRON_SECRET as a bearer token; nothing else may trigger it.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await createAdminClient().rpc("expire_stale_requests");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expired: data ?? 0 });
}

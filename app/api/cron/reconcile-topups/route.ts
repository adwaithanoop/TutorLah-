import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { creditTopupBySession } from "@/lib/payments/topups";

// Backstop for any top-up whose webhook never arrived. Vercel Cron calls this on a
// schedule with the CRON_SECRET as a bearer token; nothing else may trigger it.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only revisit rows old enough that the webhook has had its chance, so the cron never
  // races a top-up that is still completing normally.
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: pending, error } = await createAdminClient()
    .from("wallet_topups")
    .select("stripe_session_id")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let credited = 0;
  for (const row of pending ?? []) {
    if ((await creditTopupBySession(row.stripe_session_id)) === "credited") credited++;
  }

  return NextResponse.json({ checked: pending?.length ?? 0, credited });
}

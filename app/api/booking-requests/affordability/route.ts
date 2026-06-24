import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAffordability } from "@/lib/booking/availability";

// Drives the "top up to keep your other requests alive" banner. Reads only the caller's
// own wallet and requests.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const affordability = await getAffordability(supabase, user.id);
  return NextResponse.json(affordability);
}

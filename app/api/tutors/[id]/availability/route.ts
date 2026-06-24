import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFreeWindows } from "@/lib/booking/availability";

const MAX_RANGE_MS = 31 * 86_400_000;
const UUID = /^[0-9a-f-]{36}$/i;

// A tutor's free windows over a date range. The windows are computed with the service
// role (to subtract bookings RLS hides from other students) but the response carries only
// free time, so no student can infer another student's sessions.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid tutor id" }, { status: 400 });

  const fromRaw = request.nextUrl.searchParams.get("from");
  const toRaw = request.nextUrl.searchParams.get("to");
  const from = fromRaw ? new Date(fromRaw) : new Date();
  const to = toRaw ? new Date(toRaw) : new Date(Date.now() + 14 * 86_400_000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }
  if (to.getTime() - from.getTime() > MAX_RANGE_MS) {
    return NextResponse.json({ error: "Range too wide" }, { status: 400 });
  }

  const windows = await getFreeWindows(createAdminClient(), id, from, to);
  return NextResponse.json({ windows });
}

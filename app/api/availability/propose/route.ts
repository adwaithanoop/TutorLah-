import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { proposeSchema } from "@/lib/validation/availability";
import { Availability, type TimeInterval } from "@/lib/scheduling/availability";

const ONE_HOUR = 60 * 60 * 1000;

interface SlotRow {
  starts_at: string;
  ends_at: string;
}

const toIntervals = (rows: SlotRow[] | null): TimeInterval[] =>
  (rows ?? []).map((r) => ({ start: new Date(r.starts_at), end: new Date(r.ends_at) }));

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = proposeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const [{ data: mine }, { data: theirs }, { data: other }] = await Promise.all([
    supabase.from("availability").select("starts_at, ends_at").eq("profile_id", user.id),
    supabase.from("availability").select("starts_at, ends_at").eq("profile_id", parsed.data.other_id),
    supabase.from("profiles").select("full_name").eq("id", parsed.data.other_id).maybeSingle(),
  ]);

  try {
    const overlaps = new Availability(toIntervals(mine)).intersect(
      new Availability(toIntervals(theirs)),
      ONE_HOUR,
    );
    return NextResponse.json({
      otherName: other?.full_name ?? "User",
      slots: overlaps.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })),
    });
  } catch {
    return NextResponse.json({ error: "Invalid availability data" }, { status: 400 });
  }
}

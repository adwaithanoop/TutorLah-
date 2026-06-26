import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bidSchema } from "@/lib/validation/sos";
import { notifyNewBid } from "@/lib/notifications/notifier";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const parsed = bidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data: sos } = await supabase
    .from("sos_requests")
    .select("module_code, status, student_id")
    .eq("id", id)
    .maybeSingle();
  if (!sos) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (sos.status !== "open") return NextResponse.json({ error: "Request is closed" }, { status: 409 });
  if (sos.student_id === user.id) {
    return NextResponse.json({ error: "You can't bid on your own request" }, { status: 400 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("is_active, receiving_sos")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_active || !me?.receiving_sos) {
    return NextResponse.json(
      { error: "Turn on Receiving SOS from your dashboard to bid." },
      { status: 403 },
    );
  }

  const { data: verified } = await supabase
    .from("tutor_modules")
    .select("id")
    .eq("tutor_id", user.id)
    .eq("module_code", sos.module_code)
    .eq("is_verified", true)
    .maybeSingle();
  if (!verified) {
    return NextResponse.json({ error: "You must be verified for this module to bid" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("sos_bids")
    .insert({ request_id: id, tutor_id: user.id, amount: parsed.data.amount })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "You already bid on this request" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await notifyNewBid({ studentId: sos.student_id, moduleCode: sos.module_code, amount: parsed.data.amount });
  return NextResponse.json({ bid: data });
}

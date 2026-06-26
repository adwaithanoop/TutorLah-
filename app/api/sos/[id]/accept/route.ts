import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptSchema } from "@/lib/validation/sos";
import { notifySosTaken, notifySosWon } from "@/lib/notifications/notifier";

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

  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("accept_sos_bid", { p_request: id, p_bid: parsed.data.bid_id });

  if (error) {
    const conflict =
      error.code === "23505" ||
      /no longer open|not your request|insufficient wallet balance|just taken/i.test(error.message);
    return NextResponse.json({ error: error.message }, { status: conflict ? 409 : 500 });
  }
  if (data) await Promise.all([notifySosWon(data), notifySosTaken(data)]);
  return NextResponse.json({ booking_id: data });
}

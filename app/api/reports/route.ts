import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createReportSchema } from "@/lib/validation/report";

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

  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, student_id, tutor_id, module_code, escrow_state")
    .eq("id", parsed.data.booking_id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.tutor_id !== user.id) {
    return NextResponse.json({ error: "Only the tutor can submit the report" }, { status: 403 });
  }
  if (booking.escrow_state !== "held") {
    return NextResponse.json({ error: "Reports can only be submitted once the session is paid" }, { status: 409 });
  }

  const { data: report, error } = await supabase
    .from("session_reports")
    .insert({
      booking_id: booking.id,
      student_id: booking.student_id,
      tutor_id: booking.tutor_id,
      module_code: booking.module_code,
      misconceptions: parsed.data.misconceptions,
      summary: parsed.data.summary,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Report already submitted" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await createAdminClient().from("bookings").update({ report_submitted: true }).eq("id", booking.id);

  return NextResponse.json({ report });
}

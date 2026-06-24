import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createReportSchema } from "@/lib/validation/report";

// Maps the definer function's errors onto sensible HTTP statuses.
function statusFor(message: string): number {
  if (/not found/i.test(message)) return 404;
  if (/only the tutor/i.test(message)) return 403;
  if (/already submitted|once the session|is paid/i.test(message)) return 409;
  return 400;
}

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

  // The function verifies tutor ownership, the paid state, and that the session has
  // actually ended (by the database clock) before writing anything. The caller's id is
  // passed in so a request can never act on someone else's booking.
  const { data: report, error } = await createAdminClient().rpc("submit_session_report", {
    p_tutor: user.id,
    p_booking: parsed.data.booking_id,
    p_misconceptions: parsed.data.misconceptions,
    p_summary: parsed.data.summary,
  });

  if (error) {
    const message = error.message ?? "Could not submit report";
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
  return NextResponse.json({ report });
}

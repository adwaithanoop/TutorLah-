import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReviewSchema } from "@/lib/validation/review";

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

  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, student_id, tutor_id, escrow_state")
    .eq("id", parsed.data.booking_id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.student_id !== user.id) {
    return NextResponse.json({ error: "Only the student can review this session" }, { status: 403 });
  }
  if (booking.escrow_state !== "released") {
    return NextResponse.json({ error: "You can review once the session is completed" }, { status: 409 });
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      booking_id: booking.id,
      student_id: booking.student_id,
      tutor_id: booking.tutor_id,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "You already reviewed this session" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ review });
}

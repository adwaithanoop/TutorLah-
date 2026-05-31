import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingEventSchema } from "@/lib/validation/booking";
import { applyEvent, authorizeEvent } from "@/lib/booking/service";

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

  const parsed = bookingEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data: booking } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (!authorizeEvent(booking, parsed.data.event, user.id)) {
    return NextResponse.json({ error: "Not allowed for this booking" }, { status: 403 });
  }

  try {
    const updated = await applyEvent(createAdminClient(), booking, parsed.data.event, new Date());
    return NextResponse.json({ booking: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transition failed";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}

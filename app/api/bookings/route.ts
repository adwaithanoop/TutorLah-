import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBookingSchema } from "@/lib/validation/booking";
import { createBooking } from "@/lib/booking/service";

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

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  if (parsed.data.tutor_id === user.id) {
    return NextResponse.json({ error: "You cannot book yourself" }, { status: 400 });
  }

  try {
    const booking = await createBooking(createAdminClient(), user.id, parsed.data);
    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

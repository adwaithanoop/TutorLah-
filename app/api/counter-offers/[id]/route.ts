import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptCounterSchema } from "@/lib/validation/requests";
import { acceptCounterOffer } from "@/lib/booking/requests";

const UUID = /^[0-9a-f-]{36}$/i;

// Student confirms one of the tutor's offered times. The chosen slot must match a slot the
// tutor actually offered, checked inside the definer function, so the booking time can
// never be forged. This is the moment money moves, atomically.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid offer id" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = acceptCounterSchema.safeParse({ offer_id: id, ...(body as object) });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const booking = await acceptCounterOffer(
      createAdminClient(),
      user.id,
      id,
      parsed.data.scheduled_start,
      parsed.data.scheduled_end,
    );
    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not confirm the offer";
    if (/insufficient/i.test(message)) {
      return NextResponse.json(
        { error: "insufficient", message: "Top up your wallet to confirm this session." },
        { status: 402 },
      );
    }
    if (/deadlock|just taken|overlap/i.test(message)) {
      return NextResponse.json({ error: "That slot was just taken, pick another." }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

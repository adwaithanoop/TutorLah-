import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBookingSchema } from "@/lib/validation/booking";
import { quoteFixed, bookAndPay } from "@/lib/booking/service";
import { getBalance } from "@/lib/wallet/service";
import { suggestTopUp } from "@/lib/wallet/money";

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

  // The tutor's published rate is the source of truth for the price.
  const { data: tutor } = await supabase
    .from("profiles")
    .select("rate_per_hour")
    .eq("id", parsed.data.tutor_id)
    .maybeSingle();
  if (!tutor) return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
  const rate = Number(tutor.rate_per_hour);
  if (!(rate > 0)) {
    return NextResponse.json({ error: "This tutor has not set a rate yet" }, { status: 400 });
  }

  let amount: number;
  try {
    amount = quoteFixed(rate, parsed.data.scheduled_start, parsed.data.scheduled_end);
  } catch {
    return NextResponse.json({ error: "Invalid session times" }, { status: 400 });
  }

  const balance = await getBalance(supabase, user.id);
  if (balance < amount) {
    return NextResponse.json(
      { error: "insufficient", amount, balance, shortfall: suggestTopUp(amount, balance) },
      { status: 402 },
    );
  }

  try {
    const booking = await bookAndPay(createAdminClient(), user.id, parsed.data, amount);
    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not book session";
    if (/insufficient/i.test(message)) {
      const fresh = await getBalance(supabase, user.id);
      return NextResponse.json(
        { error: "insufficient", amount, balance: fresh, shortfall: suggestTopUp(amount, fresh) },
        { status: 402 },
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

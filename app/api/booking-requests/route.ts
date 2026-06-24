import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { blastSchema } from "@/lib/validation/requests";
import { createBookingRequest } from "@/lib/booking/requests";

// Sends one or more booking requests in a single blast. No money moves here; each request
// is validated and priced server-side by the definer function. Items are independent, so
// a rejected slot never blocks the others.
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

  const parsed = blastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const admin = createAdminClient();
  const created: string[] = [];
  const errors: { module_code: string; message: string }[] = [];

  for (const item of parsed.data.requests) {
    try {
      const row = await createBookingRequest(admin, user.id, item);
      created.push(row.id);
    } catch (error) {
      errors.push({
        module_code: item.module_code,
        message: error instanceof Error ? error.message : "Could not send request",
      });
    }
  }

  if (created.length === 0) {
    return NextResponse.json(
      { error: errors[0]?.message ?? "No requests could be sent", errors },
      { status: 400 },
    );
  }
  return NextResponse.json({ created, errors });
}

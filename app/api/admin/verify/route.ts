import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import { reviewSchema } from "@/lib/validation/admin";

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_tutor_module", {
    p_module: parsed.data.module_id,
    p_approve: parsed.data.approve,
    p_note: parsed.data.note ?? undefined,
    p_allow_resubmit: parsed.data.allow_resubmit ?? true,
  });

  if (error) {
    const status = error.code === "42501" ? 403 : /not found/i.test(error.message) ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ ok: true });
}

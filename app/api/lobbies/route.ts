import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLobbySchema } from "@/lib/validation/lobby";

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

  const parsed = createLobbySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data: lobby, error } = await supabase.rpc("create_lobby", {
    p_module: parsed.data.module_code,
    p_title: parsed.data.title,
    p_budget: parsed.data.budget,
    p_min: parsed.data.min_participants,
    p_max: parsed.data.max_participants,
    p_start: parsed.data.scheduled_start,
    p_end: parsed.data.scheduled_end,
    p_deadline: parsed.data.deadline,
  });

  if (error) {
    if (error.code === "42501") return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.code === "23503") return NextResponse.json({ error: "Unknown module code" }, { status: 400 });
    const conflict = error.code === "23514" || /deadline/i.test(error.message);
    return NextResponse.json({ error: error.message }, { status: conflict ? 409 : 500 });
  }
  return NextResponse.json({ lobby });
}

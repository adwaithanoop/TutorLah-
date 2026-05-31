import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGroupSchema } from "@/lib/validation/group";

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

  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data: session, error } = await supabase
    .from("group_sessions")
    .insert({ ...parsed.data, tutor_id: user.id })
    .select()
    .single();

  if (error) {
    const forbidden = error.code === "42501";
    return NextResponse.json({ error: error.message }, { status: forbidden ? 403 : 500 });
  }
  return NextResponse.json({ session });
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addModuleSchema, setTranscriptSchema } from "@/lib/validation/profile";
import { ensureModuleInCatalog } from "@/lib/modules/catalog";

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

  const parsed = addModuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  if (!parsed.data.transcript_path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid transcript path" }, { status: 400 });
  }

  const known = await ensureModuleInCatalog(parsed.data.module_code);
  if (!known) {
    return NextResponse.json({ error: "Unknown module code" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tutor_modules")
    .insert({
      tutor_id: user.id,
      module_code: parsed.data.module_code,
      grade: parsed.data.grade,
      completed_at: parsed.data.completed_at,
      transcript_path: parsed.data.transcript_path,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You've already added this module" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ module: data });
}

export async function PATCH(request: NextRequest) {
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

  const parsed = setTranscriptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  if (!parsed.data.transcript_path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid transcript path" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tutor_modules")
    .update({ transcript_path: parsed.data.transcript_path })
    .eq("id", parsed.data.module_id)
    .eq("tutor_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ module: data });
}

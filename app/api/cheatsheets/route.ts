import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheatsheetSchema, deleteCheatsheetSchema } from "@/lib/validation/cheatsheets";
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

  const parsed = createCheatsheetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  if (!parsed.data.file_path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const known = await ensureModuleInCatalog(parsed.data.module_code);
  if (!known) {
    return NextResponse.json({ error: "Unknown module code" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cheatsheets")
    .insert({
      uploader_id: user.id,
      module_code: parsed.data.module_code,
      test_label: parsed.data.test_label,
      title: parsed.data.title,
      file_path: parsed.data.file_path,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cheatsheet: data });
}

export async function DELETE(request: NextRequest) {
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

  const parsed = deleteCheatsheetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data: row } = await supabase
    .from("cheatsheets")
    .select("file_path")
    .eq("id", parsed.data.id)
    .eq("uploader_id", user.id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.storage.from("cheatsheets").remove([row.file_path]);

  const { error } = await supabase
    .from("cheatsheets")
    .delete()
    .eq("id", parsed.data.id)
    .eq("uploader_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

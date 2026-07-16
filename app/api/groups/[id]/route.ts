import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.rpc("cancel_group_session", { p_group: id });

  if (error) {
    if (error.code === "42501") return NextResponse.json({ error: error.message }, { status: 403 });
    if (/not found/i.test(error.message)) return NextResponse.json({ error: error.message }, { status: 404 });
    const conflict = /not open/i.test(error.message);
    return NextResponse.json({ error: error.message }, { status: conflict ? 409 : 500 });
  }
  return NextResponse.json({ cancelled: true });
}

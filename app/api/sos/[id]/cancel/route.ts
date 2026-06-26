import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("sos_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("student_id", user.id)
    .eq("status", "open")
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  return NextResponse.json({ request: data });
}

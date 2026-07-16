import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("enrol_in_group", { p_group: id });

  if (error) {
    const conflict =
      error.code === "23505" || /full|closed|already enrolled|insufficient wallet balance/i.test(error.message);
    return NextResponse.json({ error: error.message }, { status: conflict ? 409 : 500 });
  }
  return NextResponse.json({ price_charged: data });
}

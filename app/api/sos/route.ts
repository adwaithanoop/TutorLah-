import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSosSchema } from "@/lib/validation/sos";
import { notifyNewSos } from "@/lib/notifications/notifier";

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

  const parsed = createSosSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sos_requests")
    .insert({
      student_id: user.id,
      module_code: parsed.data.module_code,
      description: parsed.data.description,
      duration_minutes: parsed.data.duration_minutes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await notifyNewSos({
    module_code: data.module_code,
    description: data.description,
    student_id: data.student_id,
  });
  return NextResponse.json({ request: data });
}

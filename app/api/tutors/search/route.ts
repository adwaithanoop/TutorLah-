import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moduleCodeSchema } from "@/lib/validation/search";
import { searchTutors } from "@/lib/tutors/search";

export async function GET(request: NextRequest) {
  const parsed = moduleCodeSchema.safeParse(request.nextUrl.searchParams.get("module") ?? "");
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in with your NUS email to search tutors." }, { status: 401 });
  }

  try {
    const tutors = await searchTutors(supabase, parsed.data);
    return NextResponse.json({ module: parsed.data, tutors });
  } catch {
    return NextResponse.json({ error: "Failed to load tutors." }, { status: 500 });
  }
}

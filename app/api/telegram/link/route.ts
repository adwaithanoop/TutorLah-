import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { newLinkToken } from "@/lib/notifications/link-token";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (!username) return NextResponse.json({ error: "Telegram is not configured" }, { status: 500 });

  const admin = createAdminClient();
  await admin.from("telegram_link_tokens").delete().eq("user_id", user.id).is("consumed_at", null);

  const token = newLinkToken();
  const { error } = await admin.from("telegram_link_tokens").insert({
    token,
    user_id: user.id,
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ url: `https://t.me/${username}?start=${token}` });
}

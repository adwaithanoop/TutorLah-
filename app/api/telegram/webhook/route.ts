import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseStartCommand } from "@/lib/notifications/link-token";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

type AdminClient = ReturnType<typeof createAdminClient>;

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number; type?: string };
    from?: { username?: string };
  };
}

const SETUP_GUIDE =
  "👋 Welcome to TutorLah SOS alerts.\n\n" +
  "This bot messages you the moment a student posts an SOS for a module you tutor, so you can bid first.\n\n" +
  "To set up:\n" +
  "1. Open TutorLah and sign in.\n" +
  "2. Go to <b>Profile</b>, then tap <b>Connect Telegram</b>.\n" +
  "3. Tap the link it shows, then press <b>Start</b> here.\n\n" +
  "You will then get an alert here with a Bid on TutorLah button whenever a relevant SOS is posted.";

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  await handleUpdate(update);
  return NextResponse.json({ ok: true });
}

async function handleUpdate(update: TelegramUpdate): Promise<void> {
  const chat = update.message?.chat;
  if (chat?.id === undefined || chat.type !== "private") return;

  const command = parseStartCommand(update.message?.text ?? "");
  if (command === null || command.token === null) {
    await sendTelegramMessage(chat.id, SETUP_GUIDE);
    return;
  }
  await linkAccount(createAdminClient(), command.token, chat.id, update.message?.from?.username ?? null);
}

async function linkAccount(
  admin: AdminClient,
  token: string,
  chatId: number,
  username: string | null,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { data: claimed } = await admin
    .from("telegram_link_tokens")
    .update({ consumed_at: nowIso })
    .eq("token", token)
    .is("consumed_at", null)
    .gt("expires_at", nowIso)
    .select("user_id")
    .maybeSingle();
  if (!claimed) {
    await sendTelegramMessage(chatId, "That link has expired or was already used. Generate a new one from your profile.");
    return;
  }

  const { error } = await admin
    .from("telegram_accounts")
    .upsert({ user_id: claimed.user_id, chat_id: chatId, username }, { onConflict: "user_id" });
  if (error) {
    await sendTelegramMessage(chatId, "This Telegram is already linked to another TutorLah account.");
    return;
  }

  await sendTelegramMessage(
    chatId,
    "✅ Telegram linked. You'll get a message here whenever a student posts an SOS for a module you're verified to tutor.",
  );
}

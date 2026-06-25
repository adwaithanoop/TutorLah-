import { createAdminClient } from "@/lib/supabase/admin";
import { CandidateTutor, selectSosRecipients } from "./recipients";
import { formatSosMessage, formatSosTakenMessage } from "./sos-message";
import { sendTelegramMessage } from "./telegram";

type AdminClient = ReturnType<typeof createAdminClient>;

export interface SosNotification {
  module_code: string;
  description: string;
  student_id: string;
}

async function loadModuleTutorCandidates(admin: AdminClient, moduleCode: string): Promise<CandidateTutor[]> {
  const { data: verified } = await admin
    .from("verified_tutor_modules")
    .select("tutor_id")
    .eq("module_code", moduleCode);

  const tutorIds = [
    ...new Set((verified ?? []).map((row) => row.tutor_id).filter((id): id is string => id !== null)),
  ];
  if (tutorIds.length === 0) return [];

  const { data: available } = await admin
    .from("profiles")
    .select("id")
    .in("id", tutorIds)
    .eq("is_active", true)
    .eq("receiving_sos", true);
  const availableIds = (available ?? []).map((row) => row.id);
  if (availableIds.length === 0) return [];

  const { data: accounts } = await admin
    .from("telegram_accounts")
    .select("user_id, chat_id")
    .in("user_id", availableIds);

  return (accounts ?? []).map((account) => ({ tutorId: account.user_id, chatId: account.chat_id }));
}

export async function notifyNewSos(sos: SosNotification): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return;

  try {
    const admin = createAdminClient();
    const candidates = await loadModuleTutorCandidates(admin, sos.module_code);
    const chatIds = selectSosRecipients(candidates, [sos.student_id]);
    if (chatIds.length === 0) return;

    const { text, link } = formatSosMessage({
      moduleCode: sos.module_code,
      description: sos.description,
      siteUrl,
    });
    await Promise.allSettled(
      chatIds.map((chatId) => sendTelegramMessage(chatId, text, { button: { text: "Bid on TutorLah", url: link } })),
    );
  } catch {}
}

export async function notifySosTaken(bookingId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: booking } = await admin
      .from("bookings")
      .select("student_id, tutor_id, module_code")
      .eq("id", bookingId)
      .single();
    if (!booking) return;

    const candidates = await loadModuleTutorCandidates(admin, booking.module_code);
    const chatIds = selectSosRecipients(candidates, [booking.student_id, booking.tutor_id]);
    if (chatIds.length === 0) return;

    const { text } = formatSosTakenMessage({ moduleCode: booking.module_code });
    await Promise.allSettled(chatIds.map((chatId) => sendTelegramMessage(chatId, text)));
  } catch {}
}

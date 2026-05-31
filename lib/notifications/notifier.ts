const TELEGRAM_API = "https://api.telegram.org";

export async function notifyNewSos(moduleCode: string, description: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🚨 New SOS for ${moduleCode}\n\n${description}\n\nOpen TutorLah to bid.`,
      }),
    });
  } catch {}
}

const TELEGRAM_API = "https://api.telegram.org";
const SEND_TIMEOUT_MS = 5000;

export interface MessageButton {
  text: string;
  url: string;
}

interface SendMessageBody {
  chat_id: number;
  text: string;
  parse_mode: "HTML";
  disable_web_page_preview: boolean;
  reply_markup?: { inline_keyboard: MessageButton[][] };
}

const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"];

function isWebUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return false;
    return !LOOPBACK_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  opts?: { button?: MessageButton },
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  const body: SendMessageBody = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (opts?.button && isWebUrl(opts.button.url)) {
    body.reply_markup = { inline_keyboard: [[opts.button]] };
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

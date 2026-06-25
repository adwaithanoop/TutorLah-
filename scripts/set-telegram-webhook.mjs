import { loadEnv } from "./load-env.mjs";

loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!token || !secret) {
  console.error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET.");
  process.exit(1);
}

const base = process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL;
if (!base) {
  console.error("Usage: node scripts/set-telegram-webhook.mjs <public-base-url>");
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url: `${base.replace(/\/+$/, "")}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message"],
  }),
});

const result = await res.json();
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);

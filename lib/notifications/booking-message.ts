import { escapeHtml } from "./html";
import { trimTrailingSlash } from "./site-url";

export type BookingAction = "accept" | "decline" | "counter";

const TEMPLATES: Record<BookingAction, (moduleCode: string, when: string) => string> = {
  accept: (moduleCode, when) =>
    `✅ <b>Request accepted</b> for <b>${moduleCode}</b>\n\nYour session on ${when} is booked.`,
  decline: (moduleCode, when) =>
    `❌ <b>Request declined</b> for <b>${moduleCode}</b>\n\nThe tutor declined ${when}.`,
  counter: (moduleCode, when) =>
    `🔁 <b>Counter offer</b> for <b>${moduleCode}</b>\n\nThe tutor proposed ${when}.`,
};

export function formatBookingResponseMessage(input: {
  action: BookingAction;
  moduleCode: string;
  when: string;
  siteUrl: string;
}): { text: string; link: string } {
  const text = TEMPLATES[input.action](escapeHtml(input.moduleCode), escapeHtml(input.when));
  return { text, link: `${trimTrailingSlash(input.siteUrl)}/bookings/requests` };
}

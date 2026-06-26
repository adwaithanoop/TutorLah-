import { escapeHtml } from "./html";
import { trimTrailingSlash } from "./site-url";

export const MAX_DESCRIPTION = 400;

function clampDescription(description: string): string {
  if (description.length <= MAX_DESCRIPTION) return description;
  return `${description.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…`;
}

export function formatSosMessage(input: {
  moduleCode: string;
  description: string;
  siteUrl: string;
}): { text: string; link: string } {
  const text =
    `🚨 <b>New SOS</b> for <b>${escapeHtml(input.moduleCode)}</b>\n\n` +
    escapeHtml(clampDescription(input.description));
  return { text, link: `${trimTrailingSlash(input.siteUrl)}/sos` };
}

export function formatSosTakenMessage(input: { moduleCode: string }): { text: string } {
  return {
    text:
      `✅ The SOS for <b>${escapeHtml(input.moduleCode)}</b> has been taken.\n\n` +
      "Another tutor was matched, no action needed.",
  };
}

export function formatNewBidMessage(input: {
  moduleCode: string;
  rate: number;
  siteUrl: string;
}): { text: string; link: string } {
  const text =
    `💰 <b>New bid</b> on your SOS for <b>${escapeHtml(input.moduleCode)}</b>\n\n` +
    `A tutor offered $${input.rate}/hr.`;
  return { text, link: `${trimTrailingSlash(input.siteUrl)}/sos` };
}

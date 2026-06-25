import { randomBytes } from "node:crypto";

export function newLinkToken(): string {
  return randomBytes(16).toString("hex");
}

export function parseStartCommand(text: string): { token: string | null } | null {
  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+(\S+))?\s*$/);
  if (!match) return null;
  return { token: match[1] ?? null };
}

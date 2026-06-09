import { cookies } from "next/headers";

export type Mode = "student" | "tutor";

export const MODE_COOKIE = "tutorlah-mode";

export async function getMode(): Promise<Mode> {
  const store = await cookies();
  return store.get(MODE_COOKIE)?.value === "tutor" ? "tutor" : "student";
}
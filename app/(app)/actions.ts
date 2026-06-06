"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MODE_COOKIE, type Mode } from "./mode";

export async function switchMode(mode: Mode) {
  const store = await cookies();
  store.set(MODE_COOKIE, mode, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect(mode === "tutor" ? "/dashboard/tutor" : "/dashboard");
}
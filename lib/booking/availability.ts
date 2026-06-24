import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TimeInterval } from "@/lib/scheduling/availability";
import { freeWindows, committedEstimate, type WeeklyBlock, type SlotOption } from "@/lib/scheduling/slots";
import { getBalance } from "@/lib/wallet/service";

type Client = SupabaseClient<Database>;

// States that still occupy a tutor's calendar. A cancelled or refunded session frees its
// slot, so it must not subtract from availability.
const LIVE_ESCROW: Database["public"]["Enums"]["escrow_state"][] = [
  "pending_payment",
  "held",
  "completed",
  "released",
];

export interface FreeWindow {
  start: string;
  end: string;
}

// Computes a tutor's free windows over a range. This must read the tutor's bookings,
// which RLS hides from other students, so it is intended to run with the service-role
// client; it returns only opaque free windows, never any booking detail, so a student
// can never learn who else booked the tutor.
export async function getFreeWindows(
  admin: Client,
  tutorId: string,
  from: Date,
  to: Date,
  now: Date = new Date(),
): Promise<FreeWindow[]> {
  const [{ data: blocks }, { data: booked }] = await Promise.all([
    admin.from("availability_blocks").select("weekday, start_minute, end_minute").eq("profile_id", tutorId),
    admin
      .from("bookings")
      .select("scheduled_start, scheduled_end")
      .eq("tutor_id", tutorId)
      .in("escrow_state", LIVE_ESCROW)
      .lt("scheduled_start", to.toISOString())
      .gt("scheduled_end", from.toISOString()),
  ]);

  const busy: TimeInterval[] = (booked ?? []).map((b) => ({
    start: new Date(b.scheduled_start),
    end: new Date(b.scheduled_end),
  }));
  const windows = freeWindows((blocks ?? []) as WeeklyBlock[], busy, from, to, now);
  return windows.map((w) => ({ start: w.start.toISOString(), end: w.end.toISOString() }));
}

export interface Affordability {
  balance: number;
  committed: number;
  shortfall: number;
}

// What the student could still be charged across their live requests versus what they
// hold. Reads only the student's own rows, so the ordinary user client is enough.
export async function getAffordability(client: Client, userId: string): Promise<Affordability> {
  const [balance, { data: pending }] = await Promise.all([
    getBalance(client, userId),
    client
      .from("booking_requests")
      .select("module_code, amount")
      .eq("student_id", userId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString()),
  ]);

  const committed = committedEstimate(
    (pending ?? []).map((r) => ({ module_code: r.module_code, amount: Number(r.amount) })),
  );
  const shortfall = Math.max(0, Math.round((committed - balance) * 100) / 100);
  return { balance, committed, shortfall };
}

export type { SlotOption };

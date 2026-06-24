import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { BookingEscrow, type EscrowState } from "./escrow";
import type { BookingEvent } from "@/lib/validation/booking";

type Admin = SupabaseClient<Database>;
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

const MONEY_EVENTS = {
  pay: "pay_booking",
  complete: "complete_booking",
  refund: "refund_booking",
} as const;

export async function applyEvent(
  admin: Admin,
  booking: BookingRow,
  event: BookingEvent,
): Promise<BookingRow> {
  // Money transitions move funds and change state in one locked database
  // transaction, so the balance check and the escrow state can never drift apart.
  if (event === "pay" || event === "complete" || event === "refund") {
    const { data, error } = await admin.rpc(MONEY_EVENTS[event], { p_booking: booking.id });
    if (error || !data) throw new Error(error?.message ?? "Transition failed");
    return data;
  }

  // Cancel and report move no money, so the in-memory state machine stays the
  // single authority for those transitions.
  const escrow = new BookingEscrow(
    { scheduledEnd: new Date(booking.scheduled_end) },
    booking.escrow_state as EscrowState,
  );
  if (booking.report_submitted && booking.escrow_state === "held") {
    escrow.submitReport();
  }

  let reportSubmitted = booking.report_submitted;
  if (event === "cancel") {
    escrow.cancel();
  } else {
    escrow.submitReport();
    reportSubmitted = true;
  }

  const { data, error } = await admin
    .from("bookings")
    .update({ escrow_state: escrow.state, report_submitted: reportSubmitted })
    .eq("id", booking.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function authorizeEvent(booking: BookingRow, event: BookingEvent, userId: string): boolean {
  const isStudent = booking.student_id === userId;
  const isTutor = booking.tutor_id === userId;
  switch (event) {
    case "pay":
    case "cancel":
      return isStudent;
    case "report":
    case "complete":
      return isTutor;
    case "refund":
      return isStudent || isTutor;
  }
}

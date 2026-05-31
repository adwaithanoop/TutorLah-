import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { BookingEscrow, type EscrowState } from "./escrow";
import { FixedPricing, NegotiablePricing } from "@/lib/pricing/pricing";
import type { CreateBooking, BookingEvent } from "@/lib/validation/booking";

type Admin = SupabaseClient<Database>;
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

const MS_PER_HOUR = 60 * 60 * 1000;

export function quoteAmount(input: CreateBooking): number {
  const hours =
    (Date.parse(input.scheduled_end) - Date.parse(input.scheduled_start)) / MS_PER_HOUR;
  if (input.price_type === "fixed") {
    return new FixedPricing(input.rate_per_hour!, hours).quote();
  }
  return new NegotiablePricing(input.agreed!, input.min!, input.max!).quote();
}

export async function createBooking(
  admin: Admin,
  studentId: string,
  input: CreateBooking,
): Promise<BookingRow> {
  const amount = quoteAmount(input);
  const { data, error } = await admin
    .from("bookings")
    .insert({
      student_id: studentId,
      tutor_id: input.tutor_id,
      module_code: input.module_code,
      scheduled_start: input.scheduled_start,
      scheduled_end: input.scheduled_end,
      price_type: input.price_type,
      amount,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function applyEvent(
  admin: Admin,
  booking: BookingRow,
  event: BookingEvent,
  now: Date,
): Promise<BookingRow> {
  const escrow = new BookingEscrow(
    { scheduledEnd: new Date(booking.scheduled_end) },
    booking.escrow_state as EscrowState,
  );
  if (booking.report_submitted && booking.escrow_state === "held") {
    escrow.submitReport();
  }

  let reportSubmitted = booking.report_submitted;
  switch (event) {
    case "pay":
      escrow.pay();
      break;
    case "cancel":
      escrow.cancel();
      break;
    case "refund":
      escrow.refund();
      break;
    case "report":
      escrow.submitReport();
      reportSubmitted = true;
      break;
    case "complete":
      escrow.complete(now);
      escrow.release();
      break;
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

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Admin = SupabaseClient<Database>;
export type BookingRequestRow = Database["public"]["Tables"]["booking_requests"]["Row"];
export type CounterOfferRow = Database["public"]["Tables"]["counter_offers"]["Row"];
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export interface SlotInput {
  tutor_id: string;
  module_code: string;
  scheduled_start: string;
  scheduled_end: string;
}

// Each wrapper passes the authenticated caller's id explicitly; the definer function it
// calls re-checks ownership against that id, so authorisation holds even if a route is
// wrong. Prices are never sent: the function derives them from the tutor's rate.

export async function createBookingRequest(
  admin: Admin,
  studentId: string,
  item: SlotInput,
): Promise<BookingRequestRow> {
  const { data, error } = await admin.rpc("request_booking", {
    p_student: studentId,
    p_tutor: item.tutor_id,
    p_module: item.module_code,
    p_start: item.scheduled_start,
    p_end: item.scheduled_end,
  });
  if (error || !data) throw new Error(error?.message ?? "Could not send request");
  return data;
}

export async function acceptBookingRequest(
  admin: Admin,
  tutorId: string,
  requestId: string,
): Promise<BookingRow> {
  const { data, error } = await admin.rpc("accept_booking_request", {
    p_tutor: tutorId,
    p_request: requestId,
  });
  if (error || !data) throw new Error(error?.message ?? "Could not accept request");
  return data;
}

export async function declineBookingRequest(
  admin: Admin,
  tutorId: string,
  requestId: string,
): Promise<BookingRequestRow> {
  const { data, error } = await admin.rpc("decline_booking_request", {
    p_tutor: tutorId,
    p_request: requestId,
  });
  if (error || !data) throw new Error(error?.message ?? "Could not decline request");
  return data;
}

export async function cancelBookingRequest(
  admin: Admin,
  studentId: string,
  requestId: string,
): Promise<BookingRequestRow> {
  const { data, error } = await admin.rpc("cancel_booking_request", {
    p_student: studentId,
    p_request: requestId,
  });
  if (error || !data) throw new Error(error?.message ?? "Could not cancel request");
  return data;
}

export async function counterPropose(
  admin: Admin,
  tutorId: string,
  requestId: string,
  slots: { scheduled_start: string; scheduled_end: string }[],
): Promise<CounterOfferRow> {
  const { data, error } = await admin.rpc("counter_propose", {
    p_tutor: tutorId,
    p_request: requestId,
    p_slots: slots.map((s) => ({ start: s.scheduled_start, end: s.scheduled_end })),
  });
  if (error || !data) throw new Error(error?.message ?? "Could not send counter-offer");
  return data;
}

export async function acceptCounterOffer(
  admin: Admin,
  studentId: string,
  offerId: string,
  start: string,
  end: string,
): Promise<BookingRow> {
  const { data, error } = await admin.rpc("accept_counter_offer", {
    p_student: studentId,
    p_offer: offerId,
    p_start: start,
    p_end: end,
  });
  if (error || !data) throw new Error(error?.message ?? "Could not confirm the offer");
  return data;
}

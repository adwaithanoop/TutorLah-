import { z } from "zod";
import { moduleCodeSchema } from "./search";

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: "Invalid date/time",
});

// The price is not part of the request. The tutor's published rate is authoritative
// and is read server-side, so a student can never set the amount they pay.
export const createBookingSchema = z
  .object({
    tutor_id: z.string().uuid(),
    module_code: moduleCodeSchema,
    scheduled_start: isoDate,
    scheduled_end: isoDate,
  })
  .refine((b) => Date.parse(b.scheduled_end) > Date.parse(b.scheduled_start), {
    message: "Session end must be after its start",
    path: ["scheduled_end"],
  });

export const bookingEventSchema = z.object({
  event: z.enum(["pay", "report", "complete", "cancel", "refund"]),
});

export type CreateBooking = z.infer<typeof createBookingSchema>;
export type BookingEvent = z.infer<typeof bookingEventSchema>["event"];

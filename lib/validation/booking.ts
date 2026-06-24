import { z } from "zod";

export const bookingEventSchema = z.object({
  event: z.enum(["pay", "report", "complete", "cancel", "refund"]),
});

export type BookingEvent = z.infer<typeof bookingEventSchema>["event"];

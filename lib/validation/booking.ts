import { z } from "zod";
import { moduleCodeSchema } from "./search";

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: "Invalid date/time",
});

export const createBookingSchema = z
  .object({
    tutor_id: z.string().uuid(),
    module_code: moduleCodeSchema,
    scheduled_start: isoDate,
    scheduled_end: isoDate,
    price_type: z.enum(["fixed", "negotiable"]),
    rate_per_hour: z.number().positive().optional(),
    agreed: z.number().positive().optional(),
    min: z.number().nonnegative().optional(),
    max: z.number().positive().optional(),
  })
  .refine((b) => Date.parse(b.scheduled_end) > Date.parse(b.scheduled_start), {
    message: "Session end must be after its start",
    path: ["scheduled_end"],
  })
  .refine((b) => (b.price_type === "fixed" ? b.rate_per_hour !== undefined : true), {
    message: "Fixed pricing needs an hourly rate",
    path: ["rate_per_hour"],
  })
  .refine(
    (b) =>
      b.price_type === "negotiable"
        ? b.agreed !== undefined && b.min !== undefined && b.max !== undefined
        : true,
    { message: "Negotiable pricing needs agreed, min and max", path: ["agreed"] },
  );

export const bookingEventSchema = z.object({
  event: z.enum(["pay", "report", "complete", "cancel", "refund"]),
});

export type CreateBooking = z.infer<typeof createBookingSchema>;
export type BookingEvent = z.infer<typeof bookingEventSchema>["event"];

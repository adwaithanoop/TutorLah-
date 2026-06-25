import { z } from "zod";
import { moduleCodeSchema } from "./search";

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: "Invalid date/time",
});

const ALLOWED_DURATION_MIN = [60, 90, 120, 150, 180];
const MIN_MS = 60_000;

// A single requested or offered slot. The duration is constrained to the bookable
// lengths; the price is never present here, it is derived server-side from the tutor's
// rate, so a tampered payload cannot change what a session costs.
const slotShape = z
  .object({ scheduled_start: isoDate, scheduled_end: isoDate })
  .refine((s) => Date.parse(s.scheduled_end) > Date.parse(s.scheduled_start), {
    message: "End must be after start",
    path: ["scheduled_end"],
  })
  .refine((s) => ALLOWED_DURATION_MIN.includes((Date.parse(s.scheduled_end) - Date.parse(s.scheduled_start)) / MIN_MS), {
    message: "Sessions must be 1, 1.5, 2, 2.5 or 3 hours",
    path: ["scheduled_end"],
  });

export const blastSchema = z.object({
  requests: z
    .array(
      z
        .object({ tutor_id: z.string().uuid(), module_code: moduleCodeSchema })
        .and(slotShape),
    )
    .min(1, "Pick at least one slot")
    .max(10, "You can send at most 10 requests at once"),
});

export const requestActionSchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
});

export const counterProposeSchema = z.object({
  slots: z.array(slotShape).min(1, "Offer at least one slot").max(3, "Offer at most three slots"),
});

export const acceptCounterSchema = z
  .object({ offer_id: z.string().uuid(), scheduled_start: isoDate, scheduled_end: isoDate })
  .refine((s) => Date.parse(s.scheduled_end) > Date.parse(s.scheduled_start), {
    message: "End must be after start",
    path: ["scheduled_end"],
  });

// Tutor's weekly availability block. Minutes sit on the half-hour grid, and each block is
// one session-sized window: at least 1 hour and at most 3 hours. Longer availability is
// expressed as several adjacent blocks, so a tutor can never mark a whole afternoon as a
// single slot and assume the app will carve it up.
export const weeklyBlockSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    start_minute: z.number().int().min(0).max(1380).multipleOf(30),
    end_minute: z.number().int().min(60).max(1440).multipleOf(30),
  })
  .refine((b) => b.end_minute - b.start_minute >= 60 && b.end_minute - b.start_minute <= 180, {
    message: "A block must be between 1 and 3 hours long",
    path: ["end_minute"],
  });

export type Blast = z.infer<typeof blastSchema>;
export type CounterPropose = z.infer<typeof counterProposeSchema>;
export type AcceptCounter = z.infer<typeof acceptCounterSchema>;
export type WeeklyBlockInput = z.infer<typeof weeklyBlockSchema>;

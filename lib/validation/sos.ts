import { z } from "zod";
import { moduleCodeSchema } from "./search";
import { ALLOWED_DURATION_MIN } from "./requests";

export const createSosSchema = z.object({
  module_code: moduleCodeSchema,
  description: z.string().trim().min(10, "Describe what you're stuck on").max(1000),
  duration_minutes: z
    .number()
    .int()
    .refine((n) => ALLOWED_DURATION_MIN.includes(n), {
      message: "Pick a session length between 1 and 3 hours",
    }),
});

export const bidSchema = z.object({
  amount: z.number().positive().max(1000),
});

export const acceptSchema = z.object({
  bid_id: z.string().uuid(),
});

export type CreateSos = z.infer<typeof createSosSchema>;

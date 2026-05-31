import { z } from "zod";
import { moduleCodeSchema } from "./search";

export const createSosSchema = z.object({
  module_code: moduleCodeSchema,
  description: z.string().trim().min(10, "Describe what you're stuck on").max(1000),
});

export const bidSchema = z.object({
  rate: z.number().positive().max(1000),
});

export const acceptSchema = z.object({
  bid_id: z.string().uuid(),
});

export type CreateSos = z.infer<typeof createSosSchema>;

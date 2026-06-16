import { z } from "zod";

export const reviewSchema = z.object({
  module_id: z.string().uuid(),
  approve: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

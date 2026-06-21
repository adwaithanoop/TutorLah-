import { z } from "zod";

export const reviewSchema = z.object({
  module_id: z.string().uuid(),
  approve: z.boolean(),
  note: z.string().trim().max(500).optional(),
  allow_resubmit: z.boolean().optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

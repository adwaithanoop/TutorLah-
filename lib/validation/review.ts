import { z } from "zod";

export const createReviewSchema = z.object({
  booking_id: z.string().regex(/^[0-9a-f-]{36}$/i, "Invalid booking id"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

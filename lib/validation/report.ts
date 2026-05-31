import { z } from "zod";

export const createReportSchema = z.object({
  booking_id: z.string().regex(/^[0-9a-f-]{36}$/i, "Invalid booking id"),
  misconceptions: z.string().trim().min(10, "Describe the misconceptions (min 10 characters)"),
  summary: z.string().trim().min(10, "Add a session summary (min 10 characters)"),
});

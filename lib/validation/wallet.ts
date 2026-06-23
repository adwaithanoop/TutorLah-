import { z } from "zod";

export const topupSchema = z.object({
  amount: z
    .number()
    .positive()
    .min(1, "Top up at least $1")
    .max(1000, "Top up at most $1000 at a time"),
  redirect: z.string().startsWith("/").max(300).optional(),
});

export type TopUp = z.infer<typeof topupSchema>;

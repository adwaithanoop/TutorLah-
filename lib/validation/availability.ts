import { z } from "zod";

const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: "Invalid date/time" });

export const addSlotSchema = z
  .object({
    starts_at: iso,
    ends_at: iso,
    kind: z.enum(["fixed", "flexible"]),
  })
  .refine((b) => Date.parse(b.ends_at) > Date.parse(b.starts_at), {
    message: "End must be after start",
    path: ["ends_at"],
  });

export const proposeSchema = z.object({
  other_id: z.string().regex(/^[0-9a-f-]{36}$/i, "Invalid user id"),
});

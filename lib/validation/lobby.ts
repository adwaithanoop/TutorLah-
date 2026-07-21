import { z } from "zod";
import { moduleCodeSchema } from "./search";

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: "Invalid date/time",
});

export const createLobbySchema = z
  .object({
    module_code: moduleCodeSchema,
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
    budget: z.number().positive("Budget must be greater than 0"),
    min_participants: z
      .number()
      .int("Min participants must be a whole number")
      .min(2, "A lobby needs at least 2 participants")
      .max(100, "Min participants cannot exceed 100"),
    max_participants: z
      .number()
      .int("Max participants must be a whole number")
      .min(2, "A lobby needs at least 2 participants")
      .max(100, "Max participants cannot exceed 100"),
    scheduled_start: isoDate,
    scheduled_end: isoDate,
    deadline: isoDate,
  })
  .refine((l) => Date.parse(l.scheduled_end) > Date.parse(l.scheduled_start), {
    message: "Session end must be after its start",
    path: ["scheduled_end"],
  })
  .refine((l) => l.max_participants >= l.min_participants, {
    message: "Max participants cannot be below the minimum",
    path: ["max_participants"],
  })
  .refine((l) => Date.parse(l.deadline) < Date.parse(l.scheduled_start), {
    message: "Deadline must be before the session starts",
    path: ["deadline"],
  })
  .refine((l) => Date.parse(l.deadline) > Date.now(), {
    message: "Deadline must be in the future",
    path: ["deadline"],
  });

export type CreateLobby = z.infer<typeof createLobbySchema>;

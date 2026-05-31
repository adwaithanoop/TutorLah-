import { z } from "zod";
import { moduleCodeSchema } from "./search";

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: "Invalid date/time",
});

export const createGroupSchema = z
  .object({
    module_code: moduleCodeSchema,
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
    total_cost: z.number().positive("Total cost must be greater than 0"),
    max_participants: z
      .number()
      .int("Max participants must be a whole number")
      .min(1, "Allow at least 1 participant")
      .max(100, "Max participants cannot exceed 100"),
    floor_per_student: z.number().nonnegative("Floor price cannot be negative"),
    scheduled_start: isoDate,
    scheduled_end: isoDate,
  })
  .refine((g) => Date.parse(g.scheduled_end) > Date.parse(g.scheduled_start), {
    message: "Session end must be after its start",
    path: ["scheduled_end"],
  });

export type CreateGroup = z.infer<typeof createGroupSchema>;

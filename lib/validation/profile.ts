import { z } from "zod";
import { moduleCodeSchema } from "./search";

export const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-amber-500",
] as const;

export const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C"] as const;

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(80),
  faculty: z.string().trim().max(80).nullish(),
  year: z.string().trim().max(20).nullish(),
  rate_per_hour: z.number().min(0).max(1000),
  avatar_color: z.enum(AVATAR_COLORS),
});

export const availabilitySchema = z
  .object({
    is_active: z.boolean().optional(),
    receiving_sos: z.boolean().optional(),
  })
  .refine((v) => v.is_active !== undefined || v.receiving_sos !== undefined, {
    message: "Nothing to update",
  });

export const addModuleSchema = z.object({
  module_code: moduleCodeSchema,
  grade: z.enum(GRADES),
  completed_at: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)) && new Date(s) <= new Date(), {
      message: "Completion date must be valid and not in the future",
    }),
  transcript_path: z.string().min(1, "Attach your transcript"),
});

export const setTranscriptSchema = z.object({
  module_id: z.string().uuid(),
  transcript_path: z.string().min(1),
});

export const setAvatarSchema = z.object({
  avatar_path: z.string().min(1).max(255).nullable(),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type AddModule = z.infer<typeof addModuleSchema>;

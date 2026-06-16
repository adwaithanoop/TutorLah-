import { z } from "zod";
import { moduleCodeSchema } from "./search";

export const createCheatsheetSchema = z.object({
  module_code: moduleCodeSchema,
  test_label: z.string().trim().min(1, "Pick which test this is for").max(100),
  title: z.string().trim().min(1, "Give the cheatsheet a title").max(120),
  file_path: z.string().min(1),
});

export const deleteCheatsheetSchema = z.object({
  id: z.string().uuid(),
});

export type CreateCheatsheet = z.infer<typeof createCheatsheetSchema>;

import { z } from "zod";

export const sendMessageSchema = z.object({
  recipient_id: z.string().regex(/^[0-9a-f-]{36}$/i, "Invalid recipient"),
  body: z.string().trim().min(1, "Message cannot be empty").max(2000),
});

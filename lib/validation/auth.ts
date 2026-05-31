import { z } from "zod";

export const NUS_EMAIL_DOMAIN = "@u.nus.edu";

const NUS_EMAIL = /^[^@\s]+@u\.nus\.edu$/;

export const nusEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((email) => NUS_EMAIL.test(email), {
    message: "Use your NUS email (e.g. e1234567@u.nus.edu)",
  });

export function isNusEmail(email: string | null | undefined): boolean {
  return !!email && NUS_EMAIL.test(email.trim().toLowerCase());
}

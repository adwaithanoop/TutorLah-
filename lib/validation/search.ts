import { z } from "zod";

export const moduleCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2,3}\d{4}[A-Z]?$/, "Enter a valid module code (e.g. CS2040S)");

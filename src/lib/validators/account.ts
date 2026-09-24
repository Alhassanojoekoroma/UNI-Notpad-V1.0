import { z } from "zod";

export const deleteAccountSchema = z.object({
  password: z.string().max(128).optional().default(""),
  reason: z.string().max(500).optional(),
});

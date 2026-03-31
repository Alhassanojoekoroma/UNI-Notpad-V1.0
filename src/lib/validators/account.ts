import { z } from "zod/v4";

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  reason: z.string().max(500).optional(),
});

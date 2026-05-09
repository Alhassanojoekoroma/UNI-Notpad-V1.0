import { z } from "zod";

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  reason: z.string().max(500).optional(),
});

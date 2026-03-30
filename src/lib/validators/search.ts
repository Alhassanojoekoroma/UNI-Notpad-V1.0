import { z } from "zod/v4";

export const searchSchema = z.object({
  q: z.string().min(2, "Search query must be at least 2 characters").max(200),
  category: z
    .enum(["content", "tasks", "schedule", "messages", "forum"])
    .optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;

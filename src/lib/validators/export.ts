import { z } from "zod/v4";

export const exportQuerySchema = z.object({
  format: z.enum(["json", "csv"]).optional(),
  type: z.enum(["quiz_scores", "content_access"]).optional(),
});

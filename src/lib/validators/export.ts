import { z } from "zod";

export const exportQuerySchema = z.object({
  format: z.enum(["json", "csv"]).optional(),
  type: z.enum(["quiz_scores", "content_access"]).optional(),
});

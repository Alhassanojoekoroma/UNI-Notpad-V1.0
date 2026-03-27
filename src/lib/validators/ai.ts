import { z } from "zod/v4";

export const aiQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  conversationId: z.string().optional(),
  sourceContentIds: z.array(z.string()).optional(),
  learningLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export const learningToolSchema = z.object({
  toolType: z.enum([
    "study_guide",
    "quiz_mcq",
    "fill_blanks",
    "matching",
    "true_false",
    "concept_explainer",
    "study_plan",
    "audio_overview",
    "exam_prep",
    "note_summary",
  ]),
  sourceContentIds: z.array(z.string()).min(1),
  learningLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

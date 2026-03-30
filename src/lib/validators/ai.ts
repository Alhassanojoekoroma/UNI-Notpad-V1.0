import { z } from "zod/v4";

export const aiQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  conversationId: z.string().optional(),
  sourceContentIds: z.array(z.string()).optional(),
  learningLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  chatStyle: z.enum(["default", "learning_guide", "custom"]).optional(),
  responseLength: z.enum(["default", "shorter", "longer"]).optional(),
  customInstructions: z.string().max(500).optional(),
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
  topic: z.string().optional(),
  learningLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export const audioRequestSchema = z.object({
  sourceContentIds: z.array(z.string()).min(1),
  narrationStyle: z.enum(["single", "conversation"]),
  voiceId: z.string().optional(),
});

export const quizScoreSchema = z.object({
  module: z.string().min(1),
  quizType: z.enum(["mcq", "true_false", "fill_blanks", "matching"]),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
});

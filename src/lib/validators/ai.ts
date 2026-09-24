import { z } from "zod";

/**
 * Upper bounds on free-text and attachment counts. Without them a single
 * request could push an unbounded payload into the model context (and into the
 * `AIInteraction` table).
 */
const MAX_QUERY_LENGTH = 8000;
const MAX_ATTACHMENTS = 10;

const contentIdList = z
  .array(z.string().min(1).max(64))
  .max(MAX_ATTACHMENTS, `You can attach at most ${MAX_ATTACHMENTS} materials`);

export const aiQuerySchema = z.object({
  query: z.string().trim().min(1, "Query is required").max(MAX_QUERY_LENGTH),
  conversationId: z.string().max(64).optional(),
  sourceContentIds: contentIdList.optional(),
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
  sourceContentIds: contentIdList.min(1, "Select at least one material"),
  topic: z.string().trim().max(200).optional(),
  learningLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export const audioRequestSchema = z.object({
  sourceContentIds: contentIdList.min(1, "Select at least one material"),
  narrationStyle: z.enum(["single", "conversation"]),
  voiceId: z.string().max(64).optional(),
});

/** Ask-about-this-document, used by the in-viewer study assistant. */
export const studyAssistSchema = z.object({
  query: z.string().trim().min(1, "Query is required").max(MAX_QUERY_LENGTH),
  contentId: z.string().min(1, "Content is required").max(64),
  conversationId: z.string().max(64).optional(),
});

export const quizScoreSchema = z.object({
  module: z.string().min(1),
  quizType: z.enum(["mcq", "true_false", "fill_blanks", "matching"]),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
});

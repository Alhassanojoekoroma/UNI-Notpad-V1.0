import { describe, it, expect } from "vitest";
import {
  aiQuerySchema,
  learningToolSchema,
  ratingSchema,
  audioRequestSchema,
  quizScoreSchema,
} from "@/lib/validators/ai";

describe("aiQuerySchema", () => {
  it("accepts valid query", () => {
    const result = aiQuerySchema.safeParse({ query: "What is recursion?" });
    expect(result.success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const result = aiQuerySchema.safeParse({
      query: "Explain OOP",
      conversationId: "conv-1",
      sourceContentIds: ["id1", "id2"],
      learningLevel: "beginner",
      chatStyle: "learning_guide",
      responseLength: "longer",
      customInstructions: "Be concise",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty query", () => {
    const result = aiQuerySchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  it("rejects customInstructions over 500 chars", () => {
    const result = aiQuerySchema.safeParse({ query: "test", customInstructions: "a".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid learningLevel", () => {
    const result = aiQuerySchema.safeParse({ query: "test", learningLevel: "expert" });
    expect(result.success).toBe(false);
  });
});

describe("learningToolSchema", () => {
  it("accepts valid data", () => {
    const result = learningToolSchema.safeParse({
      toolType: "quiz_mcq",
      sourceContentIds: ["content-1"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty sourceContentIds", () => {
    const result = learningToolSchema.safeParse({
      toolType: "study_guide",
      sourceContentIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid toolType", () => {
    const result = learningToolSchema.safeParse({
      toolType: "invalid_tool",
      sourceContentIds: ["id1"],
    });
    expect(result.success).toBe(false);
  });
});

describe("ratingSchema", () => {
  it("accepts valid rating", () => {
    const result = ratingSchema.safeParse({ rating: 3 });
    expect(result.success).toBe(true);
  });

  it("rejects rating below 1", () => {
    const result = ratingSchema.safeParse({ rating: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = ratingSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer rating", () => {
    const result = ratingSchema.safeParse({ rating: 3.5 });
    expect(result.success).toBe(false);
  });
});

describe("audioRequestSchema", () => {
  it("accepts valid request", () => {
    const result = audioRequestSchema.safeParse({
      sourceContentIds: ["id1"],
      narrationStyle: "single",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional voiceId", () => {
    const result = audioRequestSchema.safeParse({
      sourceContentIds: ["id1"],
      narrationStyle: "conversation",
      voiceId: "voice-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty sourceContentIds", () => {
    const result = audioRequestSchema.safeParse({
      sourceContentIds: [],
      narrationStyle: "single",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid narrationStyle", () => {
    const result = audioRequestSchema.safeParse({
      sourceContentIds: ["id1"],
      narrationStyle: "dramatic",
    });
    expect(result.success).toBe(false);
  });
});

describe("quizScoreSchema", () => {
  it("accepts valid score", () => {
    const result = quizScoreSchema.safeParse({
      module: "CS101",
      quizType: "mcq",
      score: 8,
      totalQuestions: 10,
    });
    expect(result.success).toBe(true);
  });

  it("accepts score of zero", () => {
    const result = quizScoreSchema.safeParse({
      module: "CS101",
      quizType: "true_false",
      score: 0,
      totalQuestions: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty module", () => {
    const result = quizScoreSchema.safeParse({
      module: "",
      quizType: "mcq",
      score: 5,
      totalQuestions: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects totalQuestions below 1", () => {
    const result = quizScoreSchema.safeParse({
      module: "CS101",
      quizType: "mcq",
      score: 0,
      totalQuestions: 0,
    });
    expect(result.success).toBe(false);
  });
});

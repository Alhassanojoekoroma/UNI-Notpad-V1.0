import { describe, it, expect } from "vitest";
import { createForumPostSchema, reportForumPostSchema } from "@/lib/validators/forum";

describe("createForumPostSchema", () => {
  const validData = {
    module: "CS101",
    facultyId: "fac1",
    body: "Has anyone solved problem 3?",
  };

  it("accepts valid post", () => {
    const result = createForumPostSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts optional title and parentId", () => {
    const result = createForumPostSchema.safeParse({
      ...validData,
      title: "Question about arrays",
      parentId: "post-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty module", () => {
    const result = createForumPostSchema.safeParse({ ...validData, module: "" });
    expect(result.success).toBe(false);
  });

  it("rejects body over 10000 characters", () => {
    const result = createForumPostSchema.safeParse({ ...validData, body: "a".repeat(10001) });
    expect(result.success).toBe(false);
  });

  it("rejects title over 300 characters", () => {
    const result = createForumPostSchema.safeParse({ ...validData, title: "a".repeat(301) });
    expect(result.success).toBe(false);
  });
});

describe("reportForumPostSchema", () => {
  it("accepts valid reason", () => {
    const result = reportForumPostSchema.safeParse({ reason: "Offensive content" });
    expect(result.success).toBe(true);
  });

  it("rejects empty reason", () => {
    const result = reportForumPostSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });

  it("rejects reason over 500 characters", () => {
    const result = reportForumPostSchema.safeParse({ reason: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});

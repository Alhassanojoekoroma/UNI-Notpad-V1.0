import { describe, it, expect } from "vitest";
import { contentUploadSchema, contentUpdateSchema, contentRatingSchema } from "@/lib/validators/content";

describe("contentUploadSchema", () => {
  const validData = {
    title: "Intro to CS",
    facultyId: "fac1",
    semester: 1,
    module: "CS101",
    contentType: "LECTURE_NOTES" as const,
  };

  it("accepts valid upload data", () => {
    const result = contentUploadSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const result = contentUploadSchema.safeParse({
      ...validData,
      description: "A description",
      programId: "prog1",
      moduleCode: "CS-101",
      tutorialLink: "https://example.com/tutorial",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = contentUploadSchema.safeParse({ ...validData, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid contentType", () => {
    const result = contentUploadSchema.safeParse({ ...validData, contentType: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid tutorialLink URL", () => {
    const result = contentUploadSchema.safeParse({ ...validData, tutorialLink: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("contentUpdateSchema", () => {
  it("accepts partial data", () => {
    const result = contentUpdateSchema.safeParse({ title: "Updated Title" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = contentUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts status field", () => {
    const result = contentUpdateSchema.safeParse({ status: "ARCHIVED" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = contentUpdateSchema.safeParse({ status: "DELETED" });
    expect(result.success).toBe(false);
  });
});

describe("contentRatingSchema", () => {
  it("accepts valid rating", () => {
    const result = contentRatingSchema.safeParse({ rating: 4 });
    expect(result.success).toBe(true);
  });

  it("accepts rating with feedback", () => {
    const result = contentRatingSchema.safeParse({ rating: 5, feedbackText: "Great content" });
    expect(result.success).toBe(true);
  });

  it("rejects rating below 1", () => {
    const result = contentRatingSchema.safeParse({ rating: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = contentRatingSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });
});

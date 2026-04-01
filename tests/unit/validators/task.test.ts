import { describe, it, expect } from "vitest";
import { createTaskSchema, updateTaskSchema, taskInviteSchema } from "@/lib/validators/task";

describe("createTaskSchema", () => {
  it("accepts valid task with defaults", () => {
    const result = createTaskSchema.safeParse({ title: "Study for exam" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("MEDIUM");
      expect(result.data.tags).toEqual([]);
    }
  });

  it("accepts full task data", () => {
    const result = createTaskSchema.safeParse({
      title: "Complete assignment",
      description: "Chapter 5 exercises",
      deadline: "2026-04-15T00:00:00Z",
      priority: "HIGH",
      tags: ["homework", "cs101"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createTaskSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = createTaskSchema.safeParse({ title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 tags", () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    const result = createTaskSchema.safeParse({ title: "Test", tags });
    expect(result.success).toBe(false);
  });

  it("rejects tag over 50 characters", () => {
    const result = createTaskSchema.safeParse({ title: "Test", tags: ["a".repeat(51)] });
    expect(result.success).toBe(false);
  });
});

describe("updateTaskSchema", () => {
  it("accepts partial update", () => {
    const result = updateTaskSchema.safeParse({ title: "Updated title" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts nullable fields", () => {
    const result = updateTaskSchema.safeParse({ description: null, deadline: null });
    expect(result.success).toBe(true);
  });

  it("accepts status update", () => {
    const result = updateTaskSchema.safeParse({ status: "COMPLETED" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = updateTaskSchema.safeParse({ status: "IN_PROGRESS" });
    expect(result.success).toBe(false);
  });
});

describe("taskInviteSchema", () => {
  it("accepts valid email", () => {
    const result = taskInviteSchema.safeParse({ inviteeEmail: "peer@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = taskInviteSchema.safeParse({ inviteeEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = taskInviteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

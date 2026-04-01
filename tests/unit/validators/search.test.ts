import { describe, it, expect } from "vitest";
import { searchSchema } from "@/lib/validators/search";

describe("searchSchema", () => {
  it("accepts valid search query", () => {
    const result = searchSchema.safeParse({ q: "data structures" });
    expect(result.success).toBe(true);
  });

  it("accepts query with category", () => {
    const result = searchSchema.safeParse({ q: "exam prep", category: "content" });
    expect(result.success).toBe(true);
  });

  it("rejects query shorter than 2 characters", () => {
    const result = searchSchema.safeParse({ q: "a" });
    expect(result.success).toBe(false);
  });

  it("rejects query over 200 characters", () => {
    const result = searchSchema.safeParse({ q: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = searchSchema.safeParse({ q: "test", category: "users" });
    expect(result.success).toBe(false);
  });

  it("rejects missing query", () => {
    const result = searchSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

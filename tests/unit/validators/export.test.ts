import { describe, it, expect } from "vitest";
import { exportQuerySchema } from "@/lib/validators/export";

describe("exportQuerySchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = exportQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid format and type", () => {
    const result = exportQuerySchema.safeParse({ format: "csv", type: "quiz_scores" });
    expect(result.success).toBe(true);
  });

  it("accepts json format", () => {
    const result = exportQuerySchema.safeParse({ format: "json" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid format", () => {
    const result = exportQuerySchema.safeParse({ format: "xml" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = exportQuerySchema.safeParse({ type: "user_data" });
    expect(result.success).toBe(false);
  });
});

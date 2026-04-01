import { describe, it, expect } from "vitest";
import { deleteAccountSchema } from "@/lib/validators/account";

describe("deleteAccountSchema", () => {
  it("accepts valid data with password only", () => {
    const result = deleteAccountSchema.safeParse({ password: "mypassword" });
    expect(result.success).toBe(true);
  });

  it("accepts valid data with optional reason", () => {
    const result = deleteAccountSchema.safeParse({ password: "mypassword", reason: "Moving to another platform" });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = deleteAccountSchema.safeParse({ password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = deleteAccountSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects reason over 500 characters", () => {
    const result = deleteAccountSchema.safeParse({ password: "mypassword", reason: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});

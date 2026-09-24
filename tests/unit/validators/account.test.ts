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

  it("accepts an empty password for OAuth-only accounts", () => {
    const result = deleteAccountSchema.safeParse({ password: "" });
    expect(result.success).toBe(true);
  });

  it("defaults a missing password for OAuth-only accounts", () => {
    const result = deleteAccountSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.password).toBe("");
  });

  it("rejects reason over 500 characters", () => {
    const result = deleteAccountSchema.safeParse({ password: "mypassword", reason: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});

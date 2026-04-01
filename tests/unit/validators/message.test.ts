import { describe, it, expect } from "vitest";
import { sendMessageSchema, reportMessageSchema } from "@/lib/validators/message";

describe("sendMessageSchema", () => {
  const validData = {
    recipientId: "user-1",
    subject: "Hello",
    body: "This is a message.",
  };

  it("accepts valid message", () => {
    const result = sendMessageSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty recipientId", () => {
    const result = sendMessageSchema.safeParse({ ...validData, recipientId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects subject over 200 characters", () => {
    const result = sendMessageSchema.safeParse({ ...validData, subject: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects body over 5000 characters", () => {
    const result = sendMessageSchema.safeParse({ ...validData, body: "a".repeat(5001) });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = sendMessageSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("reportMessageSchema", () => {
  it("accepts valid reason", () => {
    const result = reportMessageSchema.safeParse({ reason: "Spam message" });
    expect(result.success).toBe(true);
  });

  it("rejects empty reason", () => {
    const result = reportMessageSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });

  it("rejects reason over 500 characters", () => {
    const result = reportMessageSchema.safeParse({ reason: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});

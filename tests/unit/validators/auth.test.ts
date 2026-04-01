import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, roleSetupSchema } from "@/lib/validators/auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validData = {
    name: "John Doe",
    email: "john@example.com",
    password: "securepass",
    role: "STUDENT" as const,
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = registerSchema.safeParse({
      ...validData,
      studentId: "STU001",
      accessCode: "ABC123",
      referralCode: "REF456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = registerSchema.safeParse({ ...validData, role: "SUPERUSER" });
    expect(result.success).toBe(false);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...validData, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = registerSchema.safeParse({ name: "John" });
    expect(result.success).toBe(false);
  });
});

describe("roleSetupSchema", () => {
  it("accepts valid setup data", () => {
    const result = roleSetupSchema.safeParse({ facultyId: "fac1", semester: 3, programId: "prog1" });
    expect(result.success).toBe(true);
  });

  it("rejects semester out of range", () => {
    const result = roleSetupSchema.safeParse({ facultyId: "fac1", semester: 13, programId: "prog1" });
    expect(result.success).toBe(false);
  });

  it("rejects semester of 0", () => {
    const result = roleSetupSchema.safeParse({ facultyId: "fac1", semester: 0, programId: "prog1" });
    expect(result.success).toBe(false);
  });

  it("rejects empty facultyId", () => {
    const result = roleSetupSchema.safeParse({ facultyId: "", semester: 1, programId: "prog1" });
    expect(result.success).toBe(false);
  });
});

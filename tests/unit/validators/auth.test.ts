import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  lecturerRedemptionSchema,
  roleSetupSchema,
} from "@/lib/validators/auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("normalizes email casing and whitespace", () => {
    const result = loginSchema.safeParse({
      email: "  User@Example.COM ",
      password: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
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
    password: "securepass01",
    studentId: "905001234",
    facultyId: "fac1",
    programId: "prog1",
    semester: 1,
    termsAccepted: true,
    privacyAccepted: true,
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts an optional referral code", () => {
    const result = registerSchema.safeParse({ ...validData, referralCode: "REF456" });
    expect(result.success).toBe(true);
  });

  // Privilege boundary: the public registration contract has no `role` field at
  // all, so a supplied role is ignored rather than honoured. This is what stops
  // anyone self-assigning LECTURER.
  it("ignores a client-supplied role", () => {
    const result = registerSchema.safeParse({ ...validData, role: "LECTURER" });
    expect(result.success).toBe(true);
    expect(result.success && "role" in result.data).toBe(false);
  });

  it("ignores a client-supplied access code", () => {
    const result = registerSchema.safeParse({ ...validData, accessCode: "ABC123" });
    expect(result.success && "accessCode" in result.data).toBe(false);
  });

  it("requires a student ID", () => {
    const withoutId: Partial<typeof validData> = { ...validData };
    delete withoutId.studentId;
    expect(registerSchema.safeParse(withoutId).success).toBe(false);
  });

  it("rejects a student ID containing unexpected characters", () => {
    expect(
      registerSchema.safeParse({ ...validData, studentId: "9050 01<script>" }).success,
    ).toBe(false);
  });

  it("requires faculty, program and semester", () => {
    for (const field of ["facultyId", "programId", "semester"] as const) {
      const data = { ...validData };
      delete (data as Record<string, unknown>)[field];
      expect(registerSchema.safeParse(data).success).toBe(false);
    }
  });

  it("requires both policy acceptances", () => {
    expect(registerSchema.safeParse({ ...validData, termsAccepted: false }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validData, privacyAccepted: false }).success).toBe(false);
  });

  it("rejects a password shorter than 10 characters", () => {
    expect(registerSchema.safeParse({ ...validData, password: "short123" }).success).toBe(false);
  });

  it("rejects name shorter than 2 characters", () => {
    expect(registerSchema.safeParse({ ...validData, name: "J" }).success).toBe(false);
  });

  it("rejects semester out of range", () => {
    expect(registerSchema.safeParse({ ...validData, semester: 13 }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validData, semester: 0 }).success).toBe(false);
  });

  it("rejects missing required fields", () => {
    expect(registerSchema.safeParse({ name: "John" }).success).toBe(false);
  });
});

describe("lecturerRedemptionSchema", () => {
  const validData = {
    name: "Dr Ada Kamara",
    email: "ada@uni.edu",
    password: "securepass01",
    accessCode: "A1B2C3D4E5F6",
    termsAccepted: true,
    privacyAccepted: true,
  };

  it("accepts a valid redemption", () => {
    expect(lecturerRedemptionSchema.safeParse(validData).success).toBe(true);
  });

  it("requires an access code", () => {
    const withoutCode: Partial<typeof validData> = { ...validData };
    delete withoutCode.accessCode;
    expect(lecturerRedemptionSchema.safeParse(withoutCode).success).toBe(false);
  });

  // The faculty comes from the admin-issued code, never from the request.
  it("ignores a client-supplied faculty", () => {
    const result = lecturerRedemptionSchema.safeParse({ ...validData, facultyId: "fac9" });
    expect(result.success && "facultyId" in result.data).toBe(false);
  });

  it("ignores a client-supplied role", () => {
    const result = lecturerRedemptionSchema.safeParse({ ...validData, role: "ADMIN" });
    expect(result.success && "role" in result.data).toBe(false);
  });
});

describe("roleSetupSchema", () => {
  const validData = {
    facultyId: "fac1",
    semester: 3,
    programId: "prog1",
    studentId: "905001234",
  };

  it("accepts valid setup data", () => {
    expect(roleSetupSchema.safeParse(validData).success).toBe(true);
  });

  it("requires a student ID", () => {
    const withoutId: Partial<typeof validData> = { ...validData };
    delete withoutId.studentId;
    expect(roleSetupSchema.safeParse(withoutId).success).toBe(false);
  });

  it("rejects semester out of range", () => {
    expect(roleSetupSchema.safeParse({ ...validData, semester: 13 }).success).toBe(false);
  });

  it("rejects semester of 0", () => {
    expect(roleSetupSchema.safeParse({ ...validData, semester: 0 }).success).toBe(false);
  });

  it("rejects empty facultyId", () => {
    expect(roleSetupSchema.safeParse({ ...validData, facultyId: "" }).success).toBe(false);
  });
});

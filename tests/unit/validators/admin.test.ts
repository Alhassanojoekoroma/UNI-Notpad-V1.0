import { describe, it, expect } from "vitest";
import {
  userUpdateSchema,
  settingsSchema,
  lecturerCodeSchema,
  facultySchema,
  programSchema,
  flagUpdateSchema,
  reportUpdateSchema,
  bulkMessageSchema,
  setupWizardSchema,
} from "@/lib/validators/admin";

describe("userUpdateSchema", () => {
  it("accepts valid role update", () => {
    const result = userUpdateSchema.safeParse({ role: "LECTURER" });
    expect(result.success).toBe(true);
  });

  it("accepts suspension fields", () => {
    const result = userUpdateSchema.safeParse({ isSuspended: true, suspendedReason: "Violation" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = userUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = userUpdateSchema.safeParse({ role: "SUPERADMIN" });
    expect(result.success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("accepts valid settings", () => {
    const result = settingsSchema.safeParse({ universityName: "MIT", primaryColor: "#000" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = settingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects non-integer maxSemesters", () => {
    const result = settingsSchema.safeParse({ maxSemesters: 2.5 });
    expect(result.success).toBe(false);
  });
});

describe("lecturerCodeSchema", () => {
  it("accepts valid data", () => {
    const result = lecturerCodeSchema.safeParse({ lecturerName: "Dr. Smith" });
    expect(result.success).toBe(true);
  });

  it("rejects empty lecturer name", () => {
    const result = lecturerCodeSchema.safeParse({ lecturerName: "" });
    expect(result.success).toBe(false);
  });
});

describe("facultySchema", () => {
  it("accepts valid faculty", () => {
    const result = facultySchema.safeParse({ name: "Engineering", code: "ENG" });
    expect(result.success).toBe(true);
  });

  it("rejects missing code", () => {
    const result = facultySchema.safeParse({ name: "Engineering" });
    expect(result.success).toBe(false);
  });
});

describe("programSchema", () => {
  it("accepts valid program", () => {
    const result = programSchema.safeParse({ name: "Computer Science", code: "CS", facultyId: "fac1" });
    expect(result.success).toBe(true);
  });

  it("rejects missing facultyId", () => {
    const result = programSchema.safeParse({ name: "Computer Science", code: "CS" });
    expect(result.success).toBe(false);
  });
});

describe("flagUpdateSchema", () => {
  it("accepts valid flag update", () => {
    const result = flagUpdateSchema.safeParse({ status: "RESOLVED", action: "REMOVE_CONTENT" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = flagUpdateSchema.safeParse({ status: "OPEN" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid action", () => {
    const result = flagUpdateSchema.safeParse({ status: "PENDING", action: "DELETE" });
    expect(result.success).toBe(false);
  });
});

describe("reportUpdateSchema", () => {
  it("accepts valid report update", () => {
    const result = reportUpdateSchema.safeParse({ status: "REVIEWED", actionTaken: "WARN" });
    expect(result.success).toBe(true);
  });

  it("rejects missing status", () => {
    const result = reportUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("bulkMessageSchema", () => {
  it("accepts valid bulk message", () => {
    const result = bulkMessageSchema.safeParse({
      subject: "Announcement",
      body: "Important update for all students.",
      recipientFilter: { type: "ALL" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts filter with role", () => {
    const result = bulkMessageSchema.safeParse({
      subject: "Notice",
      body: "Lecturer meeting tomorrow.",
      recipientFilter: { type: "ROLE", role: "LECTURER" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing recipientFilter", () => {
    const result = bulkMessageSchema.safeParse({ subject: "Test", body: "Body" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid filter type", () => {
    const result = bulkMessageSchema.safeParse({
      subject: "Test",
      body: "Body",
      recipientFilter: { type: "CUSTOM" },
    });
    expect(result.success).toBe(false);
  });
});

describe("setupWizardSchema", () => {
  const validSetup = {
    universityName: "Test University",
    adminName: "Admin User",
    adminEmail: "admin@test.edu",
    adminPassword: "securepass123",
    faculties: [{ name: "Science", code: "SCI" }],
    geminiApiKey: "key-gemini",
    resendApiKey: "key-resend",
    cloudinaryCloudName: "cloud-name",
    cloudinaryApiKey: "cloud-key",
    cloudinaryApiSecret: "cloud-secret",
  };

  it("accepts valid setup data", () => {
    const result = setupWizardSchema.safeParse(validSetup);
    expect(result.success).toBe(true);
  });

  it("accepts faculties with programs", () => {
    const result = setupWizardSchema.safeParse({
      ...validSetup,
      faculties: [{ name: "Science", code: "SCI", programs: [{ name: "Physics", code: "PHY" }] }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty faculties array", () => {
    const result = setupWizardSchema.safeParse({ ...validSetup, faculties: [] });
    expect(result.success).toBe(false);
  });

  it("rejects missing required API keys", () => {
    const { geminiApiKey, ...incomplete } = validSetup;
    const result = setupWizardSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("rejects short admin password", () => {
    const result = setupWizardSchema.safeParse({ ...validSetup, adminPassword: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid admin email", () => {
    const result = setupWizardSchema.safeParse({ ...validSetup, adminEmail: "not-email" });
    expect(result.success).toBe(false);
  });
});

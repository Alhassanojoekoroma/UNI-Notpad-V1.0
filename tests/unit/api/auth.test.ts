import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, BASE_URL } from "../../helpers/request";

let mockPrisma: any;
let mockAuth: any;

beforeEach(async () => {
  vi.clearAllMocks();
  mockPrisma = (await import("@/lib/prisma")).prisma as any;
  mockAuth = (await import("@/lib/auth")).auth as any;
  mockPrisma.user.findFirst.mockReset();
  mockPrisma.user.findUnique.mockReset();
  mockPrisma.appSettings.findFirst.mockReset();
});

// ── POST /api/auth/register ────────────────────────────────────────
//
// This endpoint creates STUDENT accounts and nothing else. A `role` in the
// request body is not part of the contract and must never reach the database —
// accepting it was how anyone could self-assign LECTURER.

describe("POST /api/auth/register", () => {
  const url = BASE_URL + "/api/auth/register";

  const validStudent = {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "password1234",
    studentId: "905001234",
    facultyId: "fac-1",
    programId: "prog-1",
    semester: 1,
    termsAccepted: true,
    privacyAccepted: true,
  };

  function happyPath() {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.faculty.findFirst.mockResolvedValue({ id: "fac-1" });
    mockPrisma.program.findFirst.mockResolvedValue({ id: "prog-1" });
    mockPrisma.appSettings.findFirst.mockResolvedValue({
      studentIdPattern: "^90500\\d{4,}$",
    });
    mockPrisma.user.create.mockResolvedValue({
      id: "new-user-id",
      email: validStudent.email,
      role: "STUDENT",
    });
  }

  it("creates a student successfully → 201", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    happyPath();

    const response = await POST(createMockRequest("POST", url, validStudent));
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe(validStudent.email);
    expect(mockPrisma.user.create).toHaveBeenCalledOnce();
  });

  it("always assigns STUDENT even when the body asks for LECTURER", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    happyPath();

    const response = await POST(
      createMockRequest("POST", url, {
        ...validStudent,
        role: "LECTURER",
        accessCode: "SOME-CODE",
      }),
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "STUDENT" }),
      }),
    );
  });

  it("always assigns STUDENT even when the body asks for ADMIN", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    happyPath();

    const response = await POST(
      createMockRequest("POST", url, { ...validStudent, role: "ADMIN" }),
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "STUDENT" }),
      }),
    );
  });

  it("rejects a student ID that does not match the configured pattern → 400", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    happyPath();

    const response = await POST(
      createMockRequest("POST", url, { ...validStudent, studentId: "12345678" }),
    );
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/student id/i);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects a program outside the selected faculty → 400", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    happyPath();
    mockPrisma.program.findFirst.mockResolvedValue(null);

    const response = await POST(createMockRequest("POST", url, validStudent));
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/program/i);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate email → 409", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    happyPath();
    // Email and student-ID checks both use findFirst; answer only the email one.
    mockPrisma.user.findFirst.mockImplementation((args: any) =>
      Promise.resolve(args?.where?.email ? { id: "existing" } : null),
    );

    const response = await POST(createMockRequest("POST", url, validStudent));
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(409);
    expect(data.error).toMatch(/email/i);
  });

  it("rejects duplicate student ID → 409", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    happyPath();
    mockPrisma.user.findFirst.mockImplementation((args: any) =>
      Promise.resolve(args?.where?.studentId ? { id: "existing" } : null),
    );

    const response = await POST(createMockRequest("POST", url, validStudent));
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(409);
    expect(data.error).toMatch(/student id/i);
  });

  it("rejects invalid input (missing fields) → 400", async () => {
    const { POST } = await import("@/app/api/auth/register/route");

    const response = await POST(createMockRequest("POST", url, { email: "bad" }));
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("rate limits repeated registration attempts → 429", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    happyPath();

    let lastStatus = 0;
    for (let i = 0; i < 7; i++) {
      lastStatus = (await POST(createMockRequest("POST", url, validStudent)))
        .status;
    }

    expect(lastStatus).toBe(429);
  });
});

// ── POST /api/auth/register/lecturer ───────────────────────────────

describe("POST /api/auth/register/lecturer", () => {
  const url = BASE_URL + "/api/auth/register/lecturer";

  const validLecturer = {
    name: "Dr Smith",
    email: "smith@uni.edu",
    password: "password1234",
    accessCode: "A1B2C3D4E5F6",
    termsAccepted: true,
    privacyAccepted: true,
  };

  function codeMatches(facultyId: string | null = "fac-7") {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.lecturerCode.findMany.mockResolvedValue([
      { id: "lc-1", code: "$2a$12$hashed", facultyId },
    ]);
    mockPrisma.user.create.mockResolvedValue({
      id: "lect-1",
      email: validLecturer.email,
      role: "LECTURER",
    });
    mockPrisma.lecturerCode.updateMany.mockResolvedValue({ count: 1 });
  }

  it("creates a LECTURER and claims the code → 201", async () => {
    const { POST } = await import("@/app/api/auth/register/lecturer/route");
    const bcrypt = (await import("bcryptjs")).default;
    (bcrypt.compare as any).mockResolvedValue(true);
    codeMatches();

    const response = await POST(createMockRequest("POST", url, validLecturer));

    expect(response.status).toBe(201);
    // Faculty is inherited from the admin-issued code.
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "LECTURER", facultyId: "fac-7" }),
      }),
    );
    // The code is claimed so it can never mint a second account.
    expect(mockPrisma.lecturerCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "lc-1", usedAt: null }),
      }),
    );
  });

  it("ignores a client-supplied facultyId", async () => {
    const { POST } = await import("@/app/api/auth/register/lecturer/route");
    const bcrypt = (await import("bcryptjs")).default;
    (bcrypt.compare as any).mockResolvedValue(true);
    codeMatches();

    await POST(
      createMockRequest("POST", url, {
        ...validLecturer,
        facultyId: "fac-attacker",
      }),
    );

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ facultyId: "fac-7" }),
      }),
    );
  });

  it("only considers unredeemed, unrevoked codes", async () => {
    const { POST } = await import("@/app/api/auth/register/lecturer/route");
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.lecturerCode.findMany.mockResolvedValue([]);

    await POST(createMockRequest("POST", url, validLecturer));

    expect(mockPrisma.lecturerCode.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, revokedAt: null, usedAt: null },
      }),
    );
  });

  it("fails closed when the code was claimed concurrently", async () => {
    const { POST } = await import("@/app/api/auth/register/lecturer/route");
    const bcrypt = (await import("bcryptjs")).default;
    (bcrypt.compare as any).mockResolvedValue(true);
    codeMatches();
    // Compare-and-set loses the race: another request claimed it first.
    mockPrisma.lecturerCode.updateMany.mockResolvedValue({ count: 0 });

    const response = await POST(createMockRequest("POST", url, validLecturer));

    expect(response.status).toBe(409);
  });

  it("rejects an invalid access code → 403", async () => {
    const { POST } = await import("@/app/api/auth/register/lecturer/route");
    const bcrypt = (await import("bcryptjs")).default;
    (bcrypt.compare as any).mockResolvedValue(false);

    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.lecturerCode.findMany.mockResolvedValue([
      { id: "lc-1", code: "$2a$12$hashed", facultyId: null },
    ]);

    const response = await POST(
      createMockRequest("POST", url, {
        ...validLecturer,
        accessCode: "WRONGCODE123",
      }),
    );
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(403);
    expect(data.error).toMatch(/access code/i);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects a request with no access code → 400", async () => {
    const { POST } = await import("@/app/api/auth/register/lecturer/route");
    const withoutCode: Partial<typeof validLecturer> = { ...validLecturer };
    delete withoutCode.accessCode;

    const response = await POST(createMockRequest("POST", url, withoutCode));

    expect(response.status).toBe(400);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects an email that is already registered → 409", async () => {
    const { POST } = await import("@/app/api/auth/register/lecturer/route");
    mockPrisma.user.findFirst.mockResolvedValue({ id: "existing" });

    const response = await POST(createMockRequest("POST", url, validLecturer));

    expect(response.status).toBe(409);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });
});

// ── POST /api/auth/verify ──────────────────────────────────────────

describe("POST /api/auth/verify", () => {
  const url = BASE_URL + "/api/auth/verify";

  it("verifies email with valid token → 200", async () => {
    const { POST } = await import("@/app/api/auth/verify/route");

    mockPrisma.verificationToken.findUnique.mockResolvedValue({
      identifier: "email-verify:jane@example.com",
      token: "valid-token",
      expires: new Date(Date.now() + 3600000),
    });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.verificationToken.delete.mockResolvedValue({});

    const response = await POST(
      createMockRequest("POST", url, { token: "valid-token" }),
    );
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "jane@example.com" } }),
    );
  });

  it("rejects expired token → 400", async () => {
    const { POST } = await import("@/app/api/auth/verify/route");

    mockPrisma.verificationToken.findUnique.mockResolvedValue({
      identifier: "email-verify:jane@example.com",
      token: "expired-token",
      expires: new Date(Date.now() - 3600000),
    });

    const response = await POST(
      createMockRequest("POST", url, { token: "expired-token" }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects non-existent token → 400", async () => {
    const { POST } = await import("@/app/api/auth/verify/route");

    mockPrisma.verificationToken.findUnique.mockResolvedValue(null);

    const response = await POST(
      createMockRequest("POST", url, { token: "nonexistent" }),
    );

    expect(response.status).toBe(400);
  });
});

// ── POST /api/auth/forgot-password ─────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  const url = BASE_URL + "/api/auth/forgot-password";

  it("creates a reset token and sends an email for an existing address", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const { sendPasswordResetEmail } = await import("@/lib/resend");

    mockPrisma.user.findFirst.mockResolvedValue({
      id: "u1",
      email: "jane@example.com",
      name: "Jane",
    });
    mockPrisma.verificationToken.deleteMany.mockResolvedValue({});
    mockPrisma.verificationToken.create.mockResolvedValue({});

    const response = await POST(
      createMockRequest("POST", url, { email: "jane@example.com" }),
    );
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.verificationToken.create).toHaveBeenCalledOnce();
    // Previously a TODO sat here and no email was ever sent.
    expect(sendPasswordResetEmail).toHaveBeenCalledOnce();
  });

  it("matches the address case-insensitively", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");

    mockPrisma.user.findFirst.mockResolvedValue({
      id: "u1",
      email: "jane@example.com",
      name: null,
    });
    mockPrisma.verificationToken.deleteMany.mockResolvedValue({});
    mockPrisma.verificationToken.create.mockResolvedValue({});

    const response = await POST(
      createMockRequest("POST", url, { email: "Jane@Example.COM" }),
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: { equals: "jane@example.com", mode: "insensitive" },
        },
      }),
    );
    expect(mockPrisma.verificationToken.create).toHaveBeenCalledOnce();
  });

  it("returns 200 for a non-existent email (no enumeration)", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");

    mockPrisma.user.findFirst.mockResolvedValue(null);

    const response = await POST(
      createMockRequest("POST", url, { email: "nobody@example.com" }),
    );
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.verificationToken.create).not.toHaveBeenCalled();
  });

  it("rate limits repeated requests → 429", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    mockPrisma.user.findFirst.mockResolvedValue(null);

    let lastStatus = 0;
    for (let i = 0; i < 7; i++) {
      lastStatus = (
        await POST(createMockRequest("POST", url, { email: "a@b.com" }))
      ).status;
    }

    expect(lastStatus).toBe(429);
  });
});

// ── POST /api/auth/reset-password ──────────────────────────────────

describe("POST /api/auth/reset-password", () => {
  const url = BASE_URL + "/api/auth/reset-password";

  it("resets the password and terminates existing sessions → 200", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");

    mockPrisma.verificationToken.findUnique.mockResolvedValue({
      identifier: "password-reset:jane@example.com",
      token: "reset-token-that-is-long-enough",
      expires: new Date(Date.now() + 3600000),
    });
    mockPrisma.user.findFirst.mockResolvedValue({ id: "u1" });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.session.deleteMany.mockResolvedValue({});
    mockPrisma.verificationToken.deleteMany.mockResolvedValue({});

    const response = await POST(
      createMockRequest("POST", url, {
        token: "reset-token-that-is-long-enough",
        password: "newpassword123",
      }),
    );
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // passwordChangedAt invalidates JWTs minted before the reset...
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          passwordChangedAt: expect.any(Date),
        }),
      }),
    );
    // ...and DB-backed OAuth sessions are deleted outright.
    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
  });

  it("rejects an invalid or expired token → 400", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");

    mockPrisma.verificationToken.findUnique.mockResolvedValue(null);

    const response = await POST(
      createMockRequest("POST", url, {
        token: "bad-token-that-is-long-enough",
        password: "newpassword123",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects a token that is not a password-reset token → 400", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");

    // An email-verification token must not be usable to change a password.
    mockPrisma.verificationToken.findUnique.mockResolvedValue({
      identifier: "email-verify:jane@example.com",
      token: "verify-token-that-is-long-enough",
      expires: new Date(Date.now() + 3600000),
    });

    const response = await POST(
      createMockRequest("POST", url, {
        token: "verify-token-that-is-long-enough",
        password: "newpassword123",
      }),
    );

    expect(response.status).toBe(400);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a short password → 400", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");

    const response = await POST(
      createMockRequest("POST", url, {
        token: "some-token-that-is-long-enough",
        password: "short",
      }),
    );

    expect(response.status).toBe(400);
  });
});

// ── PATCH /api/users/setup ─────────────────────────────────────────

describe("PATCH /api/users/setup", () => {
  const url = BASE_URL + "/api/users/setup";

  const validSetup = {
    facultyId: "fac-1",
    semester: 2,
    programId: "prog-1",
    studentId: "905001234",
  };

  function happyPath() {
    mockPrisma.faculty.findFirst.mockResolvedValue({ id: "fac-1" });
    mockPrisma.program.findFirst.mockResolvedValue({ id: "prog-1" });
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.appSettings.findFirst.mockResolvedValue({
      studentIdPattern: "^90500\\d{4,}$",
    });
    mockPrisma.user.update.mockResolvedValue({});
  }

  it("completes setup with valid data → 200", async () => {
    const { PATCH } = await import("@/app/api/users/setup/route");
    happyPath();

    const response = await PATCH(createMockRequest("PATCH", url, validSetup));
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledOnce();
  });

  // Privilege boundary: faculty membership authorises lecturer uploads and
  // forum moderation, so a lecturer must never be able to set their own.
  it("refuses a LECTURER trying to assign themselves a faculty → 403", async () => {
    const { PATCH } = await import("@/app/api/users/setup/route");
    happyPath();
    mockAuth.mockResolvedValueOnce({
      user: { id: "lect-1", role: "LECTURER", facultyId: null },
    });

    const response = await PATCH(createMockRequest("PATCH", url, validSetup));

    expect(response.status).toBe(403);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("refuses an ADMIN → 403", async () => {
    const { PATCH } = await import("@/app/api/users/setup/route");
    happyPath();
    mockAuth.mockResolvedValueOnce({
      user: { id: "admin-1", role: "ADMIN", facultyId: null },
    });

    const response = await PATCH(createMockRequest("PATCH", url, validSetup));

    expect(response.status).toBe(403);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("validates studentId instead of trusting the raw body → 400", async () => {
    const { PATCH } = await import("@/app/api/users/setup/route");
    happyPath();

    const response = await PATCH(
      createMockRequest("PATCH", url, { ...validSetup, studentId: "not-valid" }),
    );
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/student id/i);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects invalid faculty → 400", async () => {
    const { PATCH } = await import("@/app/api/users/setup/route");
    happyPath();
    mockPrisma.faculty.findFirst.mockResolvedValue(null);

    const response = await PATCH(createMockRequest("PATCH", url, validSetup));
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/invalid faculty/i);
  });

  it("rejects a program outside the selected faculty → 400", async () => {
    const { PATCH } = await import("@/app/api/users/setup/route");
    happyPath();
    mockPrisma.program.findFirst.mockResolvedValue(null);

    const response = await PATCH(createMockRequest("PATCH", url, validSetup));
    const data = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/program/i);
  });

  it("rejects unauthenticated request → 401", async () => {
    const { PATCH } = await import("@/app/api/users/setup/route");

    mockAuth.mockResolvedValueOnce(null);

    const response = await PATCH(createMockRequest("PATCH", url, validSetup));

    expect(response.status).toBe(401);
  });
});

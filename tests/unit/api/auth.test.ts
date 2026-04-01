import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, BASE_URL } from "../../helpers/request";

let mockPrisma: any;
let mockAuth: any;

beforeEach(async () => {
  vi.clearAllMocks();
  mockPrisma = (await import("@/lib/prisma")).prisma as any;
  mockAuth = (await import("@/lib/auth")).auth as any;
});

// ── POST /api/auth/register ────────────────────────────────────────

describe("POST /api/auth/register", () => {
  const url = `${BASE_URL}/api/auth/register`;

  const validStudent = {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "password123",
    role: "STUDENT",
    studentId: "STU-001",
    facultyId: "fac-1",
    semester: 1,
    termsAccepted: true,
    privacyAccepted: true,
  };

  it("creates a student successfully → 201", async () => {
    const { POST } = await import("@/app/api/auth/register/route");

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.faculty.findUnique.mockResolvedValue({ id: "fac-1", name: "Engineering" });
    mockPrisma.user.create.mockResolvedValue({
      id: "new-user-id",
      email: validStudent.email,
      role: "STUDENT",
    });

    const request = createMockRequest("POST", url, validStudent);
    const response = await POST(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(201);
    expect((data as any).success).toBe(true);
    expect((data as any).data.email).toBe(validStudent.email);
    expect(mockPrisma.user.create).toHaveBeenCalledOnce();
  });

  it("rejects duplicate email → 409", async () => {
    const { POST } = await import("@/app/api/auth/register/route");

    mockPrisma.user.findUnique.mockResolvedValue({ id: "existing", email: validStudent.email });

    const request = createMockRequest("POST", url, validStudent);
    const response = await POST(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(409);
    expect((data as any).error).toMatch(/email/i);
  });

  it("rejects duplicate student ID → 409", async () => {
    const { POST } = await import("@/app/api/auth/register/route");

    // First findUnique (email) → null, second (studentId) → existing
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing", studentId: "STU-001" });

    const request = createMockRequest("POST", url, validStudent);
    const response = await POST(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(409);
    expect((data as any).error).toMatch(/student id/i);
  });

  it("rejects lecturer without access code → 400", async () => {
    const { POST } = await import("@/app/api/auth/register/route");

    mockPrisma.user.findUnique.mockResolvedValue(null);

    const request = createMockRequest("POST", url, {
      name: "Dr. Smith",
      email: "smith@uni.edu",
      password: "password123",
      role: "LECTURER",
    });
    const response = await POST(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(400);
    expect((data as any).error).toMatch(/access code/i);
  });

  it("rejects lecturer with invalid access code → 403", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const bcrypt = (await import("bcryptjs")).default;

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.lecturerCode.findMany.mockResolvedValue([
      { id: "lc-1", code: "$2a$12$hashed", isActive: true, revokedAt: null },
    ]);
    // Override bcrypt.compare to return false for this test
    (bcrypt.compare as any).mockResolvedValue(false);

    const request = createMockRequest("POST", url, {
      name: "Dr. Smith",
      email: "smith@uni.edu",
      password: "password123",
      role: "LECTURER",
      accessCode: "WRONG-CODE",
    });
    const response = await POST(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(403);
    expect((data as any).error).toMatch(/invalid access code/i);
  });

  it("rejects invalid input (missing fields) → 400", async () => {
    const { POST } = await import("@/app/api/auth/register/route");

    const request = createMockRequest("POST", url, { email: "bad" });
    const response = await POST(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(400);
    expect((data as any).success).toBe(false);
  });
});

// ── POST /api/auth/verify ──────────────────────────────────────────

describe("POST /api/auth/verify", () => {
  const url = `${BASE_URL}/api/auth/verify`;

  it("verifies email with valid token → 200", async () => {
    const { POST } = await import("@/app/api/auth/verify/route");

    mockPrisma.verificationToken.findUnique.mockResolvedValue({
      identifier: "email-verify:jane@example.com",
      token: "valid-token",
      expires: new Date(Date.now() + 3600000),
    });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.verificationToken.delete.mockResolvedValue({});

    const request = createMockRequest("POST", url, { token: "valid-token" });
    const response = await POST(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(200);
    expect((data as any).success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "jane@example.com" } })
    );
  });

  it("rejects expired token → 400", async () => {
    const { POST } = await import("@/app/api/auth/verify/route");

    mockPrisma.verificationToken.findUnique.mockResolvedValue({
      identifier: "email-verify:jane@example.com",
      token: "expired-token",
      expires: new Date(Date.now() - 3600000), // 1 hour ago
    });

    const request = createMockRequest("POST", url, { token: "expired-token" });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("rejects non-existent token → 400", async () => {
    const { POST } = await import("@/app/api/auth/verify/route");

    mockPrisma.verificationToken.findUnique.mockResolvedValue(null);

    const request = createMockRequest("POST", url, { token: "nonexistent" });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

// ── POST /api/auth/forgot-password ─────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  const url = `${BASE_URL}/api/auth/forgot-password`;

  it("returns 200 for existing email (creates reset token)", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");

    mockPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "jane@example.com" });
    mockPrisma.verificationToken.deleteMany.mockResolvedValue({});
    mockPrisma.verificationToken.create.mockResolvedValue({});

    const request = createMockRequest("POST", url, { email: "jane@example.com" });
    const response = await POST(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(200);
    expect((data as any).success).toBe(true);
    expect(mockPrisma.verificationToken.create).toHaveBeenCalledOnce();
  });

  it("returns 200 for non-existent email (no enumeration)", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");

    mockPrisma.user.findUnique.mockResolvedValue(null);

    const request = createMockRequest("POST", url, { email: "nobody@example.com" });
    const response = await POST(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(200);
    expect((data as any).success).toBe(true);
    expect(mockPrisma.verificationToken.create).not.toHaveBeenCalled();
  });
});

// ── POST /api/auth/reset-password ──────────────────────────────────

describe("POST /api/auth/reset-password", () => {
  const url = `${BASE_URL}/api/auth/reset-password`;

  it("resets password with valid token → 200", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");

    mockPrisma.verificationToken.findUnique.mockResolvedValue({
      identifier: "password-reset:jane@example.com",
      token: "reset-token",
      expires: new Date(Date.now() + 3600000),
    });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.verificationToken.delete.mockResolvedValue({});

    const request = createMockRequest("POST", url, {
      token: "reset-token",
      password: "newpassword123",
    });
    const response = await POST(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(200);
    expect((data as any).success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "jane@example.com" } })
    );
  });

  it("rejects invalid/expired token → 400", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");

    mockPrisma.verificationToken.findUnique.mockResolvedValue(null);

    const request = createMockRequest("POST", url, {
      token: "bad-token",
      password: "newpassword123",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("rejects missing/short password → 400", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");

    const request = createMockRequest("POST", url, {
      token: "some-token",
      password: "short",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

// ── PATCH /api/users/setup ─────────────────────────────────────────

describe("PATCH /api/users/setup", () => {
  const url = `${BASE_URL}/api/users/setup`;

  const validSetup = {
    facultyId: "fac-1",
    semester: 2,
    programId: "prog-1",
    studentId: "STU-100",
  };

  it("completes setup with valid data → 200", async () => {
    const { PATCH } = await import("@/app/api/users/setup/route");

    mockPrisma.faculty.findUnique.mockResolvedValue({ id: "fac-1", name: "Engineering" });
    mockPrisma.program.findUnique.mockResolvedValue({
      id: "prog-1",
      facultyId: "fac-1",
      name: "CS",
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.update.mockResolvedValue({});

    const request = createMockRequest("PATCH", url, validSetup);
    const response = await PATCH(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(200);
    expect((data as any).success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledOnce();
  });

  it("rejects invalid faculty → 400", async () => {
    const { PATCH } = await import("@/app/api/users/setup/route");

    mockPrisma.faculty.findUnique.mockResolvedValue(null);

    const request = createMockRequest("PATCH", url, validSetup);
    const response = await PATCH(request);
    const data = await parseResponse(response);

    expect(response.status).toBe(400);
    expect((data as any).error).toMatch(/invalid faculty/i);
  });

  it("rejects unauthenticated request → 401", async () => {
    const { PATCH } = await import("@/app/api/users/setup/route");

    mockAuth.mockResolvedValueOnce(null);

    const request = createMockRequest("PATCH", url, validSetup);
    const response = await PATCH(request);

    expect(response.status).toBe(401);
  });
});

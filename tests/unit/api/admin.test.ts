import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, createMockParams, BASE_URL } from "../../helpers/request";

vi.mock("@/lib/purge-deleted-users", () => ({
  purgeDeletedUsers: vi.fn().mockResolvedValue(3),
}));

let mockPrisma: any;
let mockAuth: any;

beforeEach(async () => {
  vi.clearAllMocks();
  mockPrisma = (await import("@/lib/prisma")).prisma as any;
  mockAuth = (await import("@/lib/auth")).auth as unknown as ReturnType<typeof vi.fn>;
  // Default: admin session
  mockAuth.mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN", email: "admin@test.com", name: "Admin" },
  });
});

// ── Helpers ────────────────────────────────────────────────────────

const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN", email: "admin@test.com", name: "Admin" } };
const STUDENT_SESSION = { user: { id: "user-1", role: "STUDENT" } };

// ── GET /api/admin/users ───────────────────────────────────────────

describe("GET /api/admin/users", () => {
  const url = `${BASE_URL}/api/admin/users`;

  it("returns paginated users", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    const users = [{ id: "u1", name: "Alice", role: "STUDENT" }];
    mockPrisma.user.findMany.mockResolvedValue(users);
    mockPrisma.user.count.mockResolvedValue(1);

    const res = await GET(createMockRequest("GET", url));
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data).toHaveLength(1);
    expect((data as any).pagination.total).toBe(1);
  });

  it("supports search and role filter", async () => {
    const { GET } = await import("@/app/api/admin/users/route");
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);

    const res = await GET(createMockRequest("GET", `${url}?search=test&role=STUDENT`));
    expect(res.status).toBe(200);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { GET } = await import("@/app/api/admin/users/route");
    const res = await GET(createMockRequest("GET", url));
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/users/[id] ──────────────────────────────────────

describe("GET /api/admin/users/[id]", () => {
  const url = `${BASE_URL}/api/admin/users/user-1`;

  it("returns user detail", async () => {
    const { GET } = await import("@/app/api/admin/users/[id]/route");
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", name: "Alice" });

    const res = await GET(createMockRequest("GET", url), { params: Promise.resolve({ id: "user-1" }) });
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data.id).toBe("user-1");
  });

  it("returns 404 for unknown user", async () => {
    const { GET } = await import("@/app/api/admin/users/[id]/route");
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await GET(createMockRequest("GET", url), { params: Promise.resolve({ id: "nope" }) });
    expect(res.status).toBe(404);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { GET } = await import("@/app/api/admin/users/[id]/route");
    const res = await GET(createMockRequest("GET", url), { params: Promise.resolve({ id: "user-1" }) });
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/admin/users/[id] ────────────────────────────────────

describe("PATCH /api/admin/users/[id]", () => {
  const url = `${BASE_URL}/api/admin/users/user-1`;

  it("updates user successfully", async () => {
    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    mockPrisma.user.update.mockResolvedValue({ id: "user-1", isSuspended: true });

    const res = await PATCH(
      createMockRequest("PATCH", url, { isSuspended: true }),
      { params: Promise.resolve({ id: "user-1" }) },
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const res = await PATCH(
      createMockRequest("PATCH", url, { isSuspended: true }),
      { params: Promise.resolve({ id: "user-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/admin/users/[id] ───────────────────────────────────

describe("DELETE /api/admin/users/[id]", () => {
  const url = `${BASE_URL}/api/admin/users/user-1`;

  it("soft deletes user", async () => {
    const { DELETE } = await import("@/app/api/admin/users/[id]/route");
    mockPrisma.user.update.mockResolvedValue({ id: "user-1" });

    const res = await DELETE(
      createMockRequest("DELETE", url),
      { params: Promise.resolve({ id: "user-1" }) },
    );
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
    );
  });

  it("prevents self-deletion", async () => {
    const { DELETE } = await import("@/app/api/admin/users/[id]/route");

    const res = await DELETE(
      createMockRequest("DELETE", `${BASE_URL}/api/admin/users/admin-1`),
      { params: Promise.resolve({ id: "admin-1" }) },
    );
    expect(res.status).toBe(400);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { DELETE } = await import("@/app/api/admin/users/[id]/route");
    const res = await DELETE(
      createMockRequest("DELETE", url),
      { params: Promise.resolve({ id: "user-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/settings ────────────────────────────────────────

describe("GET /api/admin/settings", () => {
  it("returns masked settings", async () => {
    const { GET } = await import("@/app/api/admin/settings/route");
    mockPrisma.appSettings.findUnique.mockResolvedValue({
      id: "default",
      geminiApiKey: "sk-abcdef1234567890",
      elevenlabsApiKey: null,
      resendApiKey: null,
      monimeApiKey: null,
      stripeSecretKey: null,
      cloudinaryApiKey: null,
      cloudinaryApiSecret: null,
    });

    const res = await GET();
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data.geminiApiKey).toMatch(/^\*{4}/);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { GET } = await import("@/app/api/admin/settings/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/admin/settings ──────────────────────────────────────

describe("PATCH /api/admin/settings", () => {
  it("updates settings", async () => {
    const { PATCH } = await import("@/app/api/admin/settings/route");
    mockPrisma.appSettings.update.mockResolvedValue({
      id: "default",
      universityName: "Test Uni",
      geminiApiKey: null,
      elevenlabsApiKey: null,
      resendApiKey: null,
      monimeApiKey: null,
      stripeSecretKey: null,
      cloudinaryApiKey: null,
      cloudinaryApiSecret: null,
    });

    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/settings`, { universityName: "Test Uni" }),
    );
    expect(res.status).toBe(200);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { PATCH } = await import("@/app/api/admin/settings/route");
    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/settings`, { universityName: "X" }),
    );
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/flags ───────────────────────────────────────────

describe("GET /api/admin/flags", () => {
  it("returns flags list", async () => {
    const { GET } = await import("@/app/api/admin/flags/route");
    mockPrisma.contentFlag.findMany.mockResolvedValue([{ id: "flag-1", status: "PENDING" }]);

    const res = await GET(createMockRequest("GET", `${BASE_URL}/api/admin/flags`));
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data).toHaveLength(1);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { GET } = await import("@/app/api/admin/flags/route");
    const res = await GET(createMockRequest("GET", `${BASE_URL}/api/admin/flags`));
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/admin/flags/[id] ────────────────────────────────────

describe("PATCH /api/admin/flags/[id]", () => {
  it("resolves flag", async () => {
    const { PATCH } = await import("@/app/api/admin/flags/[id]/route");
    mockPrisma.contentFlag.findUnique.mockResolvedValue({
      id: "flag-1",
      content: { id: "c-1", lecturerId: "lec-1" },
    });
    mockPrisma.contentFlag.update.mockResolvedValue({ id: "flag-1", status: "RESOLVED" });

    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/flags/flag-1`, { status: "RESOLVED" }),
      { params: Promise.resolve({ id: "flag-1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("returns 404 for unknown flag", async () => {
    const { PATCH } = await import("@/app/api/admin/flags/[id]/route");
    mockPrisma.contentFlag.findUnique.mockResolvedValue(null);

    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/flags/nope`, { status: "RESOLVED" }),
      { params: Promise.resolve({ id: "nope" }) },
    );
    expect(res.status).toBe(404);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { PATCH } = await import("@/app/api/admin/flags/[id]/route");
    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/flags/flag-1`, { status: "RESOLVED" }),
      { params: Promise.resolve({ id: "flag-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/reports ─────────────────────────────────────────

describe("GET /api/admin/reports", () => {
  it("returns reports", async () => {
    const { GET } = await import("@/app/api/admin/reports/route");
    mockPrisma.userReport.findMany.mockResolvedValue([{ id: "r-1", status: "PENDING" }]);

    const res = await GET(createMockRequest("GET", `${BASE_URL}/api/admin/reports`));
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data).toHaveLength(1);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { GET } = await import("@/app/api/admin/reports/route");
    const res = await GET(createMockRequest("GET", `${BASE_URL}/api/admin/reports`));
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/admin/reports/[id] ──────────────────────────────────

describe("PATCH /api/admin/reports/[id]", () => {
  it("resolves report", async () => {
    const { PATCH } = await import("@/app/api/admin/reports/[id]/route");
    mockPrisma.userReport.findUnique.mockResolvedValue({ id: "r-1", reportedUserId: "u-2" });
    mockPrisma.userReport.update.mockResolvedValue({ id: "r-1", status: "RESOLVED" });

    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/reports/r-1`, { status: "RESOLVED" }),
      { params: Promise.resolve({ id: "r-1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("returns 404 for unknown report", async () => {
    const { PATCH } = await import("@/app/api/admin/reports/[id]/route");
    mockPrisma.userReport.findUnique.mockResolvedValue(null);

    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/reports/nope`, { status: "RESOLVED" }),
      { params: Promise.resolve({ id: "nope" }) },
    );
    expect(res.status).toBe(404);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { PATCH } = await import("@/app/api/admin/reports/[id]/route");
    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/reports/r-1`, { status: "RESOLVED" }),
      { params: Promise.resolve({ id: "r-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/lecturer-codes ──────────────────────────────────

describe("GET /api/admin/lecturer-codes", () => {
  it("returns codes", async () => {
    const { GET } = await import("@/app/api/admin/lecturer-codes/route");
    mockPrisma.lecturerCode.findMany.mockResolvedValue([{ id: "lc-1", facultyId: "fac-1" }]);
    mockPrisma.faculty.findMany.mockResolvedValue([{ id: "fac-1", name: "Engineering" }]);

    const res = await GET();
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data).toHaveLength(1);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { GET } = await import("@/app/api/admin/lecturer-codes/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// ── POST /api/admin/lecturer-codes ─────────────────────────────────

describe("POST /api/admin/lecturer-codes", () => {
  it("creates code", async () => {
    const { POST } = await import("@/app/api/admin/lecturer-codes/route");
    mockPrisma.lecturerCode.create.mockResolvedValue({ id: "lc-new", code: "$2a$12$hash" });

    const res = await POST(
      createMockRequest("POST", `${BASE_URL}/api/admin/lecturer-codes`, {
        lecturerName: "Dr. Smith",
        facultyId: "fac-1",
      }),
    );
    expect(res.status).toBe(201);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { POST } = await import("@/app/api/admin/lecturer-codes/route");
    const res = await POST(
      createMockRequest("POST", `${BASE_URL}/api/admin/lecturer-codes`, { lecturerName: "Dr. X" }),
    );
    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/admin/lecturer-codes/[id] ──────────────────────────

describe("DELETE /api/admin/lecturer-codes/[id]", () => {
  it("revokes code", async () => {
    const { DELETE } = await import("@/app/api/admin/lecturer-codes/[id]/route");
    mockPrisma.lecturerCode.update.mockResolvedValue({ id: "lc-1", isActive: false });

    const res = await DELETE(
      createMockRequest("DELETE", `${BASE_URL}/api/admin/lecturer-codes/lc-1`),
      { params: Promise.resolve({ id: "lc-1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { DELETE } = await import("@/app/api/admin/lecturer-codes/[id]/route");
    const res = await DELETE(
      createMockRequest("DELETE", `${BASE_URL}/api/admin/lecturer-codes/lc-1`),
      { params: Promise.resolve({ id: "lc-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

// ── POST /api/admin/messages/bulk ──────────────────────────────────

describe("POST /api/admin/messages/bulk", () => {
  const bulkBody = {
    subject: "Announcement",
    body: "Hello everyone",
    recipientFilter: { type: "ROLE", role: "STUDENT" },
  };

  it("sends bulk message", async () => {
    const { POST } = await import("@/app/api/admin/messages/bulk/route");
    mockPrisma.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }]);
    mockPrisma.message.createMany.mockResolvedValue({ count: 2 });
    mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });

    const res = await POST(
      createMockRequest("POST", `${BASE_URL}/api/admin/messages/bulk`, bulkBody),
    );
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data.recipientCount).toBe(2);
  });

  it("preview mode returns count only", async () => {
    const { POST } = await import("@/app/api/admin/messages/bulk/route");
    mockPrisma.user.findMany.mockResolvedValue([{ id: "u1" }]);

    const res = await POST(
      createMockRequest("POST", `${BASE_URL}/api/admin/messages/bulk`, { ...bulkBody, preview: true }),
    );
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data.recipientCount).toBe(1);
    expect(mockPrisma.message.createMany).not.toHaveBeenCalled();
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { POST } = await import("@/app/api/admin/messages/bulk/route");
    const res = await POST(
      createMockRequest("POST", `${BASE_URL}/api/admin/messages/bulk`, bulkBody),
    );
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/audit-log ───────────────────────────────────────

describe("GET /api/admin/audit-log", () => {
  it("returns paginated logs", async () => {
    const { GET } = await import("@/app/api/admin/audit-log/route");
    mockPrisma.auditLog.findMany.mockResolvedValue([{ id: "log-1", action: "user.created" }]);
    mockPrisma.auditLog.count.mockResolvedValue(1);

    const res = await GET(createMockRequest("GET", `${BASE_URL}/api/admin/audit-log`));
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data).toHaveLength(1);
    expect((data as any).pagination.total).toBe(1);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { GET } = await import("@/app/api/admin/audit-log/route");
    const res = await GET(createMockRequest("GET", `${BASE_URL}/api/admin/audit-log`));
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/analytics ───────────────────────────────────────

describe("GET /api/admin/analytics", () => {
  it("returns analytics data", async () => {
    const { GET } = await import("@/app/api/admin/analytics/route");
    mockPrisma.user.groupBy.mockResolvedValue([{ role: "STUDENT", _count: 10 }]);
    mockPrisma.content.groupBy.mockResolvedValue([{ contentType: "LECTURE_NOTE", _count: 5 }]);
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.aIInteraction.findMany.mockResolvedValue([]);
    mockPrisma.content.count.mockResolvedValue(5);
    mockPrisma.user.count.mockResolvedValue(10);
    mockPrisma.aIInteraction.count.mockResolvedValue(20);

    const res = await GET();
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data.stats).toBeDefined();
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { GET } = await import("@/app/api/admin/analytics/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/dashboard ───────────────────────────────────────

describe("GET /api/admin/dashboard", () => {
  it("returns dashboard stats", async () => {
    const { GET } = await import("@/app/api/admin/dashboard/route");
    mockPrisma.user.count
      .mockResolvedValueOnce(50)   // students
      .mockResolvedValueOnce(10)   // lecturers
      .mockResolvedValueOnce(2);   // admins
    mockPrisma.content.count.mockResolvedValue(100);
    mockPrisma.aIInteraction.count.mockResolvedValue(500);
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.aIInteraction.findMany.mockResolvedValue([]);

    const res = await GET();
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data.stats.totalStudents).toBe(50);
  });

  it("rejects non-admin users (403)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", role: "STUDENT" } });
    const { GET } = await import("@/app/api/admin/dashboard/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });
});

// ── GET /api/admin/faculties ───────────────────────────────────────

describe("GET /api/admin/faculties", () => {
  it("returns faculties", async () => {
    const { GET } = await import("@/app/api/admin/faculties/route");
    mockPrisma.faculty.findMany.mockResolvedValue([{ id: "fac-1", name: "Engineering", programs: [] }]);

    const res = await GET();
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data).toHaveLength(1);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { GET } = await import("@/app/api/admin/faculties/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// ── POST /api/admin/faculties ──────────────────────────────────────

describe("POST /api/admin/faculties", () => {
  it("creates faculty", async () => {
    const { POST } = await import("@/app/api/admin/faculties/route");
    mockPrisma.faculty.create.mockResolvedValue({ id: "fac-new", name: "Science", code: "SCI" });

    const res = await POST(
      createMockRequest("POST", `${BASE_URL}/api/admin/faculties`, { name: "Science", code: "SCI" }),
    );
    expect(res.status).toBe(201);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { POST } = await import("@/app/api/admin/faculties/route");
    const res = await POST(
      createMockRequest("POST", `${BASE_URL}/api/admin/faculties`, { name: "X", code: "X" }),
    );
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/admin/faculties/[id] ────────────────────────────────

describe("PATCH /api/admin/faculties/[id]", () => {
  it("updates faculty", async () => {
    const { PATCH } = await import("@/app/api/admin/faculties/[id]/route");
    mockPrisma.faculty.update.mockResolvedValue({ id: "fac-1", name: "Updated" });

    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/faculties/fac-1`, { name: "Updated" }),
      { params: Promise.resolve({ id: "fac-1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { PATCH } = await import("@/app/api/admin/faculties/[id]/route");
    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/faculties/fac-1`, { name: "X" }),
      { params: Promise.resolve({ id: "fac-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/admin/faculties/[id] ───────────────────────────────

describe("DELETE /api/admin/faculties/[id]", () => {
  it("deactivates faculty", async () => {
    const { DELETE } = await import("@/app/api/admin/faculties/[id]/route");
    mockPrisma.faculty.update.mockResolvedValue({ id: "fac-1", isActive: false });

    const res = await DELETE(
      createMockRequest("DELETE", `${BASE_URL}/api/admin/faculties/fac-1`),
      { params: Promise.resolve({ id: "fac-1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { DELETE } = await import("@/app/api/admin/faculties/[id]/route");
    const res = await DELETE(
      createMockRequest("DELETE", `${BASE_URL}/api/admin/faculties/fac-1`),
      { params: Promise.resolve({ id: "fac-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

// ── POST /api/admin/programs ───────────────────────────────────────

describe("POST /api/admin/programs", () => {
  it("creates program", async () => {
    const { POST } = await import("@/app/api/admin/programs/route");
    mockPrisma.program.create.mockResolvedValue({ id: "prog-new", name: "CS", code: "CS" });

    const res = await POST(
      createMockRequest("POST", `${BASE_URL}/api/admin/programs`, {
        name: "CS",
        code: "CS",
        facultyId: "fac-1",
      }),
    );
    expect(res.status).toBe(201);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { POST } = await import("@/app/api/admin/programs/route");
    const res = await POST(
      createMockRequest("POST", `${BASE_URL}/api/admin/programs`, { name: "X", code: "X", facultyId: "f" }),
    );
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/admin/programs/[id] ─────────────────────────────────

describe("PATCH /api/admin/programs/[id]", () => {
  it("updates program", async () => {
    const { PATCH } = await import("@/app/api/admin/programs/[id]/route");
    mockPrisma.program.update.mockResolvedValue({ id: "prog-1", name: "Updated" });

    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/programs/prog-1`, { name: "Updated" }),
      { params: Promise.resolve({ id: "prog-1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { PATCH } = await import("@/app/api/admin/programs/[id]/route");
    const res = await PATCH(
      createMockRequest("PATCH", `${BASE_URL}/api/admin/programs/prog-1`, { name: "X" }),
      { params: Promise.resolve({ id: "prog-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/admin/programs/[id] ────────────────────────────────

describe("DELETE /api/admin/programs/[id]", () => {
  it("deactivates program", async () => {
    const { DELETE } = await import("@/app/api/admin/programs/[id]/route");
    mockPrisma.program.update.mockResolvedValue({ id: "prog-1", isActive: false });

    const res = await DELETE(
      createMockRequest("DELETE", `${BASE_URL}/api/admin/programs/prog-1`),
      { params: Promise.resolve({ id: "prog-1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { DELETE } = await import("@/app/api/admin/programs/[id]/route");
    const res = await DELETE(
      createMockRequest("DELETE", `${BASE_URL}/api/admin/programs/prog-1`),
      { params: Promise.resolve({ id: "prog-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/export ──────────────────────────────────────────

describe("GET /api/admin/export", () => {
  it("returns export data", async () => {
    const { GET } = await import("@/app/api/admin/export/route");
    mockPrisma.user.groupBy.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(10);
    mockPrisma.content.count.mockResolvedValue(5);
    mockPrisma.contentAccess.groupBy.mockResolvedValue([]);
    mockPrisma.aIInteraction.count.mockResolvedValue(20);
    mockPrisma.aIInteraction.groupBy.mockResolvedValue([]);
    mockPrisma.quizScore.aggregate.mockResolvedValue({ _count: 3, _avg: { score: 85.5 } });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("platform-export.json");
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { GET } = await import("@/app/api/admin/export/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// ── POST /api/admin/purge ──────────────────────────────────────────

describe("POST /api/admin/purge", () => {
  it("purges deleted users", async () => {
    const { POST } = await import("@/app/api/admin/purge/route");

    const res = await POST();
    const data = await parseResponse(res);

    expect(res.status).toBe(200);
    expect((data as any).data.purgedCount).toBe(3);
  });

  it("rejects non-admin users", async () => {
    mockAuth.mockResolvedValueOnce(STUDENT_SESSION);
    const { POST } = await import("@/app/api/admin/purge/route");
    const res = await POST();
    expect(res.status).toBe(401);
  });
});

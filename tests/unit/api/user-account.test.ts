import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, BASE_URL } from "../../helpers/request";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── DELETE /api/users/me ──────────────────────────────────────────

describe("DELETE /api/users/me", () => {
  it("soft deletes the user account (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      password: "$2a$12$existinghash",
      email: "student@test.com",
      name: "Test Student",
    });
    mockPrisma.user.update.mockResolvedValueOnce({});
    mockPrisma.appSettings.findFirst.mockResolvedValueOnce({
      universityName: "Test Uni",
      domain: "test.com",
    });

    const bcrypt = await import("bcryptjs");
    (bcrypt.default as any).compare.mockResolvedValueOnce(true);

    const { DELETE } = await import("@/app/api/users/me/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/users/me`, {
      password: "mypassword123",
    });
    const response = await DELETE(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });

  it("returns 401 with incorrect password", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      password: "$2a$12$existinghash",
      email: "student@test.com",
      name: "Test Student",
    });

    const bcrypt = await import("bcryptjs");
    (bcrypt.default as any).compare.mockResolvedValueOnce(false);

    const { DELETE } = await import("@/app/api/users/me/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/users/me`, {
      password: "wrongpassword",
    });
    const response = await DELETE(request);

    expect(response.status).toBe(401);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { DELETE } = await import("@/app/api/users/me/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/users/me`, {
      password: "mypassword123",
    });
    const response = await DELETE(request);

    expect(response.status).toBe(401);
  });
});

// ── GET /api/users/me/export ──────────────────────────────────────

describe("GET /api/users/me/export", () => {
  it("returns JSON data export (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;

    // Mock all the data gathering queries
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "test-user-id",
      name: "Test Student",
      email: "student@test.com",
      role: "STUDENT",
    });
    mockPrisma.task.findMany.mockResolvedValueOnce([]);
    mockPrisma.schedule.findMany.mockResolvedValueOnce([]);
    mockPrisma.message.findMany.mockResolvedValueOnce([]);
    mockPrisma.aIInteraction.findMany.mockResolvedValueOnce([]);
    mockPrisma.quizScore.findMany.mockResolvedValueOnce([]);
    mockPrisma.learningGoal.findMany.mockResolvedValueOnce([]);
    mockPrisma.contentRating.findMany.mockResolvedValueOnce([]);
    mockPrisma.contentAccess.findMany.mockResolvedValueOnce([]);
    mockPrisma.referral.findMany.mockResolvedValueOnce([]);
    mockPrisma.forumPost.findMany.mockResolvedValueOnce([]);

    const { GET } = await import("@/app/api/users/me/export/route");
    // NextRequest requires nextUrl property
    const url = new URL(`${BASE_URL}/api/users/me/export`);
    const request = { nextUrl: url, url: url.toString() } as any;
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Content-Disposition")).toContain("my-data-export.json");

    const json = JSON.parse(await response.text());
    expect(json.profile).toBeDefined();
    expect(json.exportedAt).toBeDefined();
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/users/me/export/route");
    const request = new Request(`${BASE_URL}/api/users/me/export`);
    const response = await GET(request as any);

    expect(response.status).toBe(401);
  });

  it("returns CSV quiz scores export", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.quizScore.findMany.mockResolvedValueOnce([
      { module: "CS101", quizType: "mcq", score: 8, totalQuestions: 10, createdAt: new Date("2026-01-01") },
    ]);

    const { GET } = await import("@/app/api/users/me/export/route");
    const url = new URL(`${BASE_URL}/api/users/me/export?format=csv&type=quiz_scores`);
    const request = { nextUrl: url, url: url.toString() } as any;
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    const text = await response.text();
    expect(text).toContain("module,quizType,score,totalQuestions,createdAt");
    expect(text).toContain("CS101");
  });

  it("returns CSV content access export", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.contentAccess.findMany.mockResolvedValueOnce([
      {
        content: { title: "Intro to CS", module: "CS101" },
        accessType: "view",
        createdAt: new Date("2026-02-01"),
      },
    ]);

    const { GET } = await import("@/app/api/users/me/export/route");
    const url = new URL(`${BASE_URL}/api/users/me/export?format=csv&type=content_access`);
    const request = { nextUrl: url, url: url.toString() } as any;
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    const text = await response.text();
    expect(text).toContain("contentTitle,module,accessType,createdAt");
    expect(text).toContain("Intro to CS");
  });

  it("returns 400 for CSV without type parameter", async () => {
    const { GET } = await import("@/app/api/users/me/export/route");
    const url = new URL(`${BASE_URL}/api/users/me/export?format=csv`);
    const request = { nextUrl: url, url: url.toString() } as any;
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});

// ── POST /api/users/me/cancel-deletion ────────────────────────────

describe("POST /api/users/me/cancel-deletion", () => {
  it("cancels pending deletion (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      deletedAt: new Date(),
    });
    mockPrisma.user.update.mockResolvedValueOnce({});

    const { POST } = await import("@/app/api/users/me/cancel-deletion/route");
    const response = await POST();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "test-user-id" },
      data: { deletedAt: null, isActive: true },
    });
  });

  it("returns 400 when no pending deletion", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      deletedAt: null,
    });

    const { POST } = await import("@/app/api/users/me/cancel-deletion/route");
    const response = await POST();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/users/me/cancel-deletion/route");
    const response = await POST();

    expect(response.status).toBe(401);
  });
});

// ── GET /api/lecturer/stats ───────────────────────────────────────

describe("GET /api/lecturer/stats", () => {
  it("returns stats for a lecturer (200)", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce({
      user: {
        id: "lecturer-id",
        role: "LECTURER",
        email: "lecturer@test.com",
        name: "Test Lecturer",
      },
    });

    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.content.aggregate.mockResolvedValueOnce({
      _count: 10,
      _sum: { viewCount: 500, downloadCount: 100 },
      _avg: { averageRating: 4.5 },
    });
    mockPrisma.content.findMany.mockResolvedValueOnce([
      { id: "c1", title: "Lecture 1", module: "CS101", contentType: "PDF", viewCount: 50, downloadCount: 10, createdAt: new Date() },
    ]);

    const { GET } = await import("@/app/api/lecturer/stats/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.totalContent).toBe(10);
    expect(json.data.totalViews).toBe(500);
  });

  it("returns 401 for non-lecturer role", async () => {
    // Default auth is STUDENT, which should be rejected
    const { GET } = await import("@/app/api/lecturer/stats/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/lecturer/stats/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });
});

// ── GET /api/lecturer/analytics ───────────────────────────────────

describe("GET /api/lecturer/analytics", () => {
  it("returns analytics for a lecturer (200)", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce({
      user: {
        id: "lecturer-id",
        role: "LECTURER",
        email: "lecturer@test.com",
        name: "Test Lecturer",
      },
    });

    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.content.aggregate.mockResolvedValueOnce({
      _count: 5,
      _sum: { viewCount: 200, downloadCount: 50 },
    });
    mockPrisma.content.findMany
      .mockResolvedValueOnce([]) // topContent
      .mockResolvedValueOnce([]); // allContent
    mockPrisma.contentAccess.findMany
      .mockResolvedValueOnce([]) // recentDownloads
      .mockResolvedValueOnce([]); // weeklyAccess

    const { GET } = await import("@/app/api/lecturer/analytics/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.totalContent).toBe(5);
    expect(json.data.totalViews).toBe(200);
    expect(json.data.viewsOverTime).toBeDefined();
  });

  it("returns 401 for non-lecturer role", async () => {
    const { GET } = await import("@/app/api/lecturer/analytics/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/lecturer/analytics/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });
});

// ── POST /api/setup ───────────────────────────────────────────────

describe("POST /api/setup", () => {
  const validSetupBody = {
    universityName: "Test University",
    adminName: "Admin User",
    adminEmail: "admin@test.com",
    adminPassword: "securepassword123",
    faculties: [
      {
        name: "Engineering",
        code: "ENG",
        programs: [{ name: "Computer Science", code: "CS" }],
      },
    ],
    geminiApiKey: "gemini-key",
    resendApiKey: "resend-key",
    cloudinaryCloudName: "cloud-name",
    cloudinaryApiKey: "cloud-key",
    cloudinaryApiSecret: "cloud-secret",
  };

  it("creates initial setup (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.appSettings.findUnique.mockResolvedValueOnce(null);

    // $transaction is already mocked to call the function with prisma
    // Inside the transaction, the mock uses the same prisma object
    mockPrisma.user.create.mockResolvedValueOnce({ id: "admin-1" });
    mockPrisma.faculty.create.mockResolvedValueOnce({ id: "f1" });
    mockPrisma.program.createMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.appSettings.upsert.mockResolvedValueOnce({});

    const { POST } = await import("@/app/api/setup/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/setup`, validSetupBody);
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("rejects when setup already complete (400)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.appSettings.findUnique.mockResolvedValueOnce({
      isSetupComplete: true,
    });

    const { POST } = await import("@/app/api/setup/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/setup`, validSetupBody);
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("already complete");
  });

  it("returns 400 for invalid input", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.appSettings.findUnique.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/setup/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/setup`, {
      universityName: "",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

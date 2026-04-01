import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, BASE_URL } from "../../helpers/request";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/dashboard/stats ──────────────────────────────────────

describe("GET /api/dashboard/stats", () => {
  it("returns dashboard stats (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.message.count.mockResolvedValueOnce(5);
    mockPrisma.task.count.mockResolvedValueOnce(2);
    mockPrisma.user.findUnique.mockResolvedValueOnce({ freeQueriesRemaining: 15 });

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.unreadMessages).toBe(5);
    expect(json.data.upcomingDeadlines).toBe(2);
    expect(json.data.freeQueriesRemaining).toBe(15);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/dashboard/stats/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });
});

// ── GET /api/search ───────────────────────────────────────────────

describe("GET /api/search", () => {
  it("returns search results (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.content.findMany.mockResolvedValueOnce([{ id: "c1", title: "Math Notes", module: "MATH101" }]);
    mockPrisma.task.findMany.mockResolvedValueOnce([]);
    mockPrisma.schedule.findMany.mockResolvedValueOnce([]);
    mockPrisma.message.findMany.mockResolvedValueOnce([]);
    mockPrisma.forumPost.findMany.mockResolvedValueOnce([]);

    const { GET } = await import("@/app/api/search/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/search?q=math`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.content).toHaveLength(1);
  });

  it("returns empty results for query too short", async () => {
    const { GET } = await import("@/app/api/search/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/search?q=a`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.data.content).toHaveLength(0);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/search/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/search?q=math`);
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

// ── GET /api/profile ──────────────────────────────────────────────

describe("GET /api/profile", () => {
  it("returns user profile (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "test-user-id",
      name: "Test Student",
      email: "student@test.com",
      role: "STUDENT",
    });

    const { GET } = await import("@/app/api/profile/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe("Test Student");
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/profile/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });
});

// ── PATCH /api/profile ────────────────────────────────────────────

describe("PATCH /api/profile", () => {
  it("updates profile (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.user.update.mockResolvedValueOnce({
      id: "test-user-id",
      name: "Updated Name",
      email: "student@test.com",
      role: "STUDENT",
    });

    const { PATCH } = await import("@/app/api/profile/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/profile`, {
      name: "Updated Name",
    });
    const response = await PATCH(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe("Updated Name");
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/profile/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/profile`, { name: "X" });
    const response = await PATCH(request);

    expect(response.status).toBe(401);
  });
});

// ── GET /api/faculties ────────────────────────────────────────────

describe("GET /api/faculties", () => {
  it("returns faculties (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.faculty.findMany.mockResolvedValueOnce([
      { id: "f1", name: "Engineering", code: "ENG" },
    ]);

    const { GET } = await import("@/app/api/faculties/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/faculties/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });
});

// ── GET /api/programs ─────────────────────────────────────────────

describe("GET /api/programs", () => {
  it("returns programs for a faculty (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.program.findMany.mockResolvedValueOnce([
      { id: "p1", name: "Computer Science", code: "CS" },
    ]);

    const { GET } = await import("@/app/api/programs/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/programs?facultyId=f1`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
  });

  it("returns 400 when missing facultyId", async () => {
    const { GET } = await import("@/app/api/programs/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/programs`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/programs/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/programs?facultyId=f1`);
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

// ── GET /api/settings/public ──────────────────────────────────────

describe("GET /api/settings/public", () => {
  it("returns public settings (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.appSettings.findFirst.mockResolvedValueOnce({
      universityName: "Test Uni",
      universityLogo: null,
      maxSemesters: 8,
    });

    const { GET } = await import("@/app/api/settings/public/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.universityName).toBe("Test Uni");
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/settings/public/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });
});

// ── GET /api/tokens ───────────────────────────────────────────────

describe("GET /api/tokens", () => {
  it("returns status ok (200)", async () => {
    const { GET } = await import("@/app/api/tokens/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.status).toBe("ok");
  });
});

// ── GET /api/webhooks/monime ──────────────────────────────────────

describe("GET /api/webhooks/monime", () => {
  it("returns status ok (200)", async () => {
    const { GET } = await import("@/app/api/webhooks/monime/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.status).toBe("ok");
  });
});

// ── GET /api/webhooks/stripe ──────────────────────────────────────

describe("GET /api/webhooks/stripe", () => {
  it("returns status ok (200)", async () => {
    const { GET } = await import("@/app/api/webhooks/stripe/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.status).toBe("ok");
  });
});

// ── GET /api/referrals ────────────────────────────────────────────

describe("GET /api/referrals", () => {
  it("returns status ok (200)", async () => {
    const { GET } = await import("@/app/api/referrals/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.status).toBe("ok");
  });
});

// ── GET /api/users ────────────────────────────────────────────────

describe("GET /api/users", () => {
  it("returns users matching search (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.userBlock.findMany.mockResolvedValueOnce([]);
    mockPrisma.user.findMany.mockResolvedValueOnce([
      { id: "u1", name: "John Doe", email: "john@test.com", role: "STUDENT" },
    ]);

    const { GET } = await import("@/app/api/users/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/users?search=John`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/users/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/users?search=John`);
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

// ── GET /api/users/faculties ──────────────────────────────────────

describe("GET /api/users/faculties", () => {
  it("returns faculties with programs (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.faculty.findMany.mockResolvedValueOnce([
      { id: "f1", name: "Engineering", code: "ENG" },
    ]);
    mockPrisma.program.findMany.mockResolvedValueOnce([
      { id: "p1", name: "CS", code: "CS", facultyId: "f1" },
    ]);
    mockPrisma.appSettings.findFirst.mockResolvedValueOnce({
      maxSemesters: 8,
      studentIdPattern: "^90500\\d{4,}$",
    });

    const { GET } = await import("@/app/api/users/faculties/route");
    const response = await GET();
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.faculties).toHaveLength(1);
    expect(json.data.programs).toHaveLength(1);
    expect(json.data.maxSemesters).toBe(8);
  });
});

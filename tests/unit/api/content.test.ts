import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, createMockParams, BASE_URL } from "../../helpers/request";

// ── Shared setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

const CONTENT_ITEM = {
  id: "content-1",
  title: "Intro to CS",
  module: "CS101",
  contentType: "LECTURE_NOTE",
  status: "ACTIVE",
  facultyId: "test-faculty-id",
  semester: 1,
  viewCount: 10,
  downloadCount: 5,
  averageRating: 4.2,
  createdAt: new Date().toISOString(),
  faculty: { name: "Computing" },
  lecturer: { id: "lec-1", name: "Dr. Smith", avatarUrl: null },
};

// ── GET /api/content (list) ─────────────────────────────────────────

describe("GET /api/content", () => {
  it("returns filtered content for authenticated user", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.content.findMany.mockResolvedValueOnce([CONTENT_ITEM]);
    mockPrisma.content.count.mockResolvedValueOnce(1);

    const { GET } = await import("@/app/api/content/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/content`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.pagination.total).toBe(1);
  });

  it("returns 401 for unauthenticated user", async () => {
    const { auth } = await import("@/lib/auth");
    const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/content/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/content`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it("applies search filter", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.content.findMany.mockResolvedValueOnce([]);
    mockPrisma.content.count.mockResolvedValueOnce(0);

    const { GET } = await import("@/app/api/content/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/content?search=physics`);
    const response = await GET(request);

    expect(response.status).toBe(200);
    const where = mockPrisma.content.findMany.mock.calls[0][0].where;
    expect(where.OR).toBeDefined();
    expect(where.OR[0].title.contains).toBe("physics");
  });

  it("applies pagination", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.content.findMany.mockResolvedValueOnce([]);
    mockPrisma.content.count.mockResolvedValueOnce(60);

    const { GET } = await import("@/app/api/content/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/content?page=2`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.pagination.page).toBe(2);
    expect(json.pagination.totalPages).toBe(2);
    expect(mockPrisma.content.findMany.mock.calls[0][0].skip).toBe(30);
  });
});

// ── GET /api/content/[id] (single) ─────────────────────────────────

describe("GET /api/content/[id]", () => {
  it("returns content detail for authenticated user", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.content.findUnique.mockResolvedValueOnce({
      ...CONTENT_ITEM,
      program: { name: "BSc CS" },
      ratings: [],
    });

    const { GET } = await import("@/app/api/content/[id]/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/content/content-1`);
    const context = createMockParams({ id: "content-1" });
    const response = await GET(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("content-1");
  });

  it("returns 404 when content not found", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.content.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/content/[id]/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/content/nonexistent`);
    const context = createMockParams({ id: "nonexistent" });
    const response = await GET(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe("Content not found");
  });

  it("returns 401 for unauthenticated user", async () => {
    const { auth } = await import("@/lib/auth");
    const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/content/[id]/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/content/content-1`);
    const context = createMockParams({ id: "content-1" });
    const response = await GET(request, context);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/content/[id]/rate ─────────────────────────────────────

describe("POST /api/content/[id]/rate", () => {
  it("accepts a valid rating", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.contentRating.upsert.mockResolvedValueOnce({});
    mockPrisma.contentRating.aggregate.mockResolvedValueOnce({ _avg: { rating: 4.5 } });
    mockPrisma.content.update.mockResolvedValueOnce({});

    const { POST } = await import("@/app/api/content/[id]/rate/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/content/content-1/rate`, {
      rating: 4,
      feedbackText: "Great material",
    });
    const context = createMockParams({ id: "content-1" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.contentRating.upsert).toHaveBeenCalledOnce();
  });

  it("rejects invalid rating (out of range)", async () => {
    const { POST } = await import("@/app/api/content/[id]/rate/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/content/content-1/rate`, {
      rating: 10,
    });
    const context = createMockParams({ id: "content-1" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Invalid input");
  });

  it("returns 401 for unauthenticated user", async () => {
    const { auth } = await import("@/lib/auth");
    const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
    mockAuth.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/content/[id]/rate/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/content/content-1/rate`, {
      rating: 3,
    });
    const context = createMockParams({ id: "content-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/content/[id]/flag ─────────────────────────────────────

describe("POST /api/content/[id]/flag", () => {
  it("creates a flag with valid reason", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.content.findUnique.mockResolvedValueOnce({ title: "Some Content" });
    mockPrisma.contentFlag.create.mockResolvedValueOnce({ id: "flag-1", reason: "Plagiarism" });
    mockPrisma.user.findMany.mockResolvedValueOnce([]);

    const { POST } = await import("@/app/api/content/[id]/flag/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/content/content-1/flag`, {
      reason: "Plagiarism",
    });
    const context = createMockParams({ id: "content-1" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("flag-1");
  });

  it("rejects missing reason", async () => {
    const { POST } = await import("@/app/api/content/[id]/flag/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/content/content-1/flag`, {});
    const context = createMockParams({ id: "content-1" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe("Reason is required");
  });

  it("returns 401 for unauthenticated user", async () => {
    const { auth } = await import("@/lib/auth");
    const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
    mockAuth.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/content/[id]/flag/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/content/content-1/flag`, {
      reason: "Inappropriate",
    });
    const context = createMockParams({ id: "content-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/content/[id]/access ───────────────────────────────────

describe("POST /api/content/[id]/access", () => {
  it("records view access", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.contentAccess.create.mockResolvedValueOnce({});
    mockPrisma.content.update.mockResolvedValueOnce({});

    const { POST } = await import("@/app/api/content/[id]/access/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/content/content-1/access`, {
      accessType: "view",
    });
    const context = createMockParams({ id: "content-1" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("records download access", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.contentAccess.create.mockResolvedValueOnce({});
    mockPrisma.content.update.mockResolvedValueOnce({});

    const { POST } = await import("@/app/api/content/[id]/access/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/content/content-1/access`, {
      accessType: "download",
    });
    const context = createMockParams({ id: "content-1" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 401 for unauthenticated user", async () => {
    const { auth } = await import("@/lib/auth");
    const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
    mockAuth.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/content/[id]/access/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/content/content-1/access`, {
      accessType: "view",
    });
    const context = createMockParams({ id: "content-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(401);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, createMockParams, BASE_URL } from "../../helpers/request";

// ── Shared setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

const MOCK_POST = {
  id: "post-1",
  module: "CS101",
  facultyId: "test-faculty-id",
  title: "How do pointers work?",
  body: "I need help understanding pointers in C.",
  isPinned: false,
  upvoteCount: 3,
  isAcceptedAnswer: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  authorId: "test-user-id",
  parentId: null,
  author: { id: "test-user-id", name: "Test Student", avatarUrl: null, role: "STUDENT" },
  votes: [],
  _count: { replies: 2 },
  replies: [],
};

// ── GET /api/forum ─────────────────────────────────────────────────

describe("GET /api/forum", () => {
  it("returns paginated posts for a module", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.forumPost.findMany.mockResolvedValueOnce([MOCK_POST]);
    mockPrisma.forumPost.count.mockResolvedValueOnce(1);

    const { GET } = await import("@/app/api/forum/route");
    const url = new URL(`${BASE_URL}/api/forum?module=CS101`);
    const request = new Request(url, { method: "GET" });
    // Attach nextUrl to mimic NextRequest
    (request as any).nextUrl = url;
    const response = await GET(request as any);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.pagination.total).toBe(1);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/forum/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/forum?module=CS101`);
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/forum ────────────────────────────────────────────────

describe("POST /api/forum", () => {
  it("creates a new forum post", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.forumPost.create.mockResolvedValueOnce({
      ...MOCK_POST,
      id: "post-new",
    });

    const { POST } = await import("@/app/api/forum/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/forum`, {
      module: "CS101",
      facultyId: "test-faculty-id",
      title: "How do pointers work?",
      body: "I need help understanding pointers in C.",
    });
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockPrisma.forumPost.create).toHaveBeenCalled();
  });

  it("returns 400 for missing required fields", async () => {
    const { POST } = await import("@/app/api/forum/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/forum`, {});
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/forum/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/forum`, {
      module: "CS101",
      facultyId: "test-faculty-id",
      title: "Test",
      body: "Test body",
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});

// ── GET /api/forum/[id] ────────────────────────────────────────────

describe("GET /api/forum/[id]", () => {
  it("returns a single post with replies", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.forumPost.findUnique.mockResolvedValueOnce(MOCK_POST);

    const { GET } = await import("@/app/api/forum/[id]/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/forum/post-1`);
    const context = createMockParams({ id: "post-1" });
    const response = await GET(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("post-1");
  });

  it("returns 404 when post does not exist", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.forumPost.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/forum/[id]/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/forum/nonexistent`);
    const context = createMockParams({ id: "nonexistent" });
    const response = await GET(request, context);

    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/forum/[id]/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/forum/post-1`);
    const context = createMockParams({ id: "post-1" });
    const response = await GET(request, context);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/forum/[id]/vote ──────────────────────────────────────

describe("POST /api/forum/[id]/vote", () => {
  it("adds a vote when none exists", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.forumVote.findUnique.mockResolvedValueOnce(null);
    mockPrisma.$transaction.mockResolvedValueOnce([{}, {}]);
    mockPrisma.forumPost.findUnique.mockResolvedValueOnce({ upvoteCount: 4 });

    const { POST } = await import("@/app/api/forum/[id]/vote/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/forum/post-1/vote`);
    const context = createMockParams({ id: "post-1" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.voted).toBe(true);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/forum/[id]/vote/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/forum/post-1/vote`);
    const context = createMockParams({ id: "post-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(401);
  });
});

// ── PATCH /api/forum/[id]/accept ───────────────────────────────────

describe("PATCH /api/forum/[id]/accept", () => {
  it("accepts a reply as the answer", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.forumPost.findUnique.mockResolvedValueOnce({
      id: "reply-1",
      parentId: "post-1",
      parent: { authorId: "test-user-id" },
    });
    mockPrisma.$transaction.mockResolvedValueOnce([{}, {}]);

    const { PATCH } = await import("@/app/api/forum/[id]/accept/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/forum/reply-1/accept`);
    const context = createMockParams({ id: "reply-1" });
    const response = await PATCH(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 403 when user is not the original poster", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.forumPost.findUnique.mockResolvedValueOnce({
      id: "reply-1",
      parentId: "post-1",
      parent: { authorId: "other-user-id" },
    });

    const { PATCH } = await import("@/app/api/forum/[id]/accept/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/forum/reply-1/accept`);
    const context = createMockParams({ id: "reply-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/forum/[id]/accept/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/forum/reply-1/accept`);
    const context = createMockParams({ id: "reply-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/forum/[id]/report ────────────────────────────────────

describe("POST /api/forum/[id]/report", () => {
  it("creates a report for a post", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.forumPost.findUnique.mockResolvedValueOnce({
      authorId: "other-user-id",
    });
    mockPrisma.userReport.create.mockResolvedValueOnce({
      id: "report-1",
      reportedUserId: "other-user-id",
      reporterId: "test-user-id",
      reason: "Spam content",
    });

    const { POST } = await import("@/app/api/forum/[id]/report/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/forum/post-1/report`, {
      reason: "Spam content",
    });
    const context = createMockParams({ id: "post-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(201);
  });

  it("returns 400 when reporting your own post", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.forumPost.findUnique.mockResolvedValueOnce({
      authorId: "test-user-id",
    });

    const { POST } = await import("@/app/api/forum/[id]/report/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/forum/post-1/report`, {
      reason: "Spam content",
    });
    const context = createMockParams({ id: "post-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/forum/[id]/report/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/forum/post-1/report`, {
      reason: "Spam",
    });
    const context = createMockParams({ id: "post-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(401);
  });
});

// ── PATCH /api/forum/[id]/pin ──────────────────────────────────────

describe("PATCH /api/forum/[id]/pin", () => {
  it("toggles pin on a post as lecturer", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce({
      user: { id: "lecturer-1", role: "LECTURER", facultyId: "test-faculty-id" },
    });

    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.forumPost.findUnique.mockResolvedValueOnce({
      id: "post-1",
      isPinned: false,
      parentId: null,
      facultyId: "test-faculty-id",
    });
    mockPrisma.forumPost.update.mockResolvedValueOnce({
      id: "post-1",
      isPinned: true,
    });

    const { PATCH } = await import("@/app/api/forum/[id]/pin/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/forum/post-1/pin`);
    const context = createMockParams({ id: "post-1" });
    const response = await PATCH(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.isPinned).toBe(true);
  });

  it("returns 403 when student tries to pin", async () => {
    const { PATCH } = await import("@/app/api/forum/[id]/pin/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/forum/post-1/pin`);
    const context = createMockParams({ id: "post-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/forum/[id]/pin/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/forum/post-1/pin`);
    const context = createMockParams({ id: "post-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(401);
  });
});

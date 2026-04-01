import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, createMockParams, BASE_URL } from "../../helpers/request";

// ── Shared setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

const MOCK_MESSAGE = {
  id: "msg-1",
  senderId: "sender-1",
  recipientId: "test-user-id",
  subject: "Hello",
  body: "Test message body",
  isRead: false,
  createdAt: new Date().toISOString(),
  sender: { id: "sender-1", name: "Sender User", avatarUrl: null },
};

const MOCK_SENT_MESSAGE = {
  ...MOCK_MESSAGE,
  senderId: "test-user-id",
  recipientId: "recipient-1",
  recipient: { id: "recipient-1", name: "Recipient User", avatarUrl: null },
};

// ── GET /api/messages (inbox) ───────────────────────────────────────

describe("GET /api/messages", () => {
  it("returns received messages with pagination", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.userBlock.findMany.mockResolvedValueOnce([]);
    mockPrisma.message.findMany.mockResolvedValueOnce([MOCK_MESSAGE]);
    mockPrisma.message.count.mockResolvedValueOnce(1);

    const { GET } = await import("@/app/api/messages/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/messages`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.pagination.total).toBe(1);
  });

  it("excludes messages from users who blocked the current user", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.userBlock.findMany.mockResolvedValueOnce([
      { blockerId: "blocker-1" },
    ]);
    mockPrisma.message.findMany.mockResolvedValueOnce([]);
    mockPrisma.message.count.mockResolvedValueOnce(0);

    const { GET } = await import("@/app/api/messages/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/messages`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(0);
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          senderId: { notIn: ["blocker-1"] },
        }),
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/messages/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/messages`);
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

// ── GET /api/messages/sent ──────────────────────────────────────────

describe("GET /api/messages/sent", () => {
  it("returns sent messages with pagination", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.message.findMany.mockResolvedValueOnce([MOCK_SENT_MESSAGE]);
    mockPrisma.message.count.mockResolvedValueOnce(1);

    const { GET } = await import("@/app/api/messages/sent/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/messages/sent`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.pagination.total).toBe(1);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/messages/sent/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/messages/sent`);
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/messages (send) ───────────────────────────────────────

describe("POST /api/messages", () => {
  it("creates and returns a new message", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "recipient-1" });
    mockPrisma.userBlock.findFirst.mockResolvedValueOnce(null);
    mockPrisma.message.create.mockResolvedValueOnce({ id: "msg-new", ...MOCK_MESSAGE });

    const { POST } = await import("@/app/api/messages/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/messages`, {
      recipientId: "recipient-1",
      subject: "Hello",
      body: "Test message body",
    });
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockPrisma.message.create).toHaveBeenCalled();
  });

  it("returns 404 when recipient does not exist", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/messages/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/messages`, {
      recipientId: "nonexistent",
      subject: "Hello",
      body: "Test body",
    });
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe("Recipient not found");
  });

  it("returns 403 when blocked by recipient", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "recipient-1" });
    mockPrisma.userBlock.findFirst.mockResolvedValueOnce({
      blockerId: "recipient-1",
      blockedId: "test-user-id",
    });

    const { POST } = await import("@/app/api/messages/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/messages`, {
      recipientId: "recipient-1",
      subject: "Hello",
      body: "Test body",
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it("returns 400 for missing required fields", async () => {
    const { POST } = await import("@/app/api/messages/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/messages`, {
      recipientId: "recipient-1",
      // missing subject and body
    });
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/messages/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/messages`, {
      recipientId: "recipient-1",
      subject: "Hello",
      body: "Test body",
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});

// ── PATCH /api/messages/[id]/read ───────────────────────────────────

describe("PATCH /api/messages/[id]/read", () => {
  it("marks a message as read", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.message.findUnique.mockResolvedValueOnce({
      id: "msg-1",
      recipientId: "test-user-id",
    });
    mockPrisma.message.update.mockResolvedValueOnce({ id: "msg-1", isRead: true });

    const { PATCH } = await import("@/app/api/messages/[id]/read/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/messages/msg-1/read`);
    const context = createMockParams({ id: "msg-1" });
    const response = await PATCH(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.message.update).toHaveBeenCalledWith({
      where: { id: "msg-1" },
      data: { isRead: true },
    });
  });

  it("returns 404 when user is not the recipient", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.message.findUnique.mockResolvedValueOnce({
      id: "msg-1",
      recipientId: "other-user-id",
    });

    const { PATCH } = await import("@/app/api/messages/[id]/read/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/messages/msg-1/read`);
    const context = createMockParams({ id: "msg-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/messages/[id]/read/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/messages/msg-1/read`);
    const context = createMockParams({ id: "msg-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/messages/[id]/report ──────────────────────────────────

describe("POST /api/messages/[id]/report", () => {
  it("creates a report for a message", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.message.findUnique.mockResolvedValueOnce({
      id: "msg-1",
      senderId: "sender-1",
    });
    mockPrisma.userReport.create.mockResolvedValueOnce({
      id: "report-1",
      reportedUserId: "sender-1",
      reporterId: "test-user-id",
      reason: "Spam content",
    });

    const { POST } = await import("@/app/api/messages/[id]/report/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/messages/msg-1/report`, {
      reason: "Spam content",
    });
    const context = createMockParams({ id: "msg-1" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockPrisma.userReport.create).toHaveBeenCalled();
  });

  it("returns 400 for missing reason", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.message.findUnique.mockResolvedValueOnce({
      id: "msg-1",
      senderId: "sender-1",
    });

    const { POST } = await import("@/app/api/messages/[id]/report/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/messages/msg-1/report`, {});
    const context = createMockParams({ id: "msg-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/messages/[id]/report/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/messages/msg-1/report`, {
      reason: "Spam",
    });
    const context = createMockParams({ id: "msg-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/users/[id]/block ──────────────────────────────────────

describe("POST /api/users/[id]/block", () => {
  it("blocks a user successfully", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.userBlock.upsert.mockResolvedValueOnce({
      blockerId: "test-user-id",
      blockedId: "other-user-id",
    });

    const { POST } = await import("@/app/api/users/[id]/block/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/users/other-user-id/block`);
    const context = createMockParams({ id: "other-user-id" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.userBlock.upsert).toHaveBeenCalled();
  });

  it("returns 400 when trying to block yourself", async () => {
    const { POST } = await import("@/app/api/users/[id]/block/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/users/test-user-id/block`);
    const context = createMockParams({ id: "test-user-id" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe("Cannot block yourself");
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/users/[id]/block/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/users/other-user-id/block`);
    const context = createMockParams({ id: "other-user-id" });
    const response = await POST(request, context);

    expect(response.status).toBe(401);
  });
});

// ── DELETE /api/users/[id]/block ────────────────────────────────────

describe("DELETE /api/users/[id]/block", () => {
  it("unblocks a user successfully", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.userBlock.deleteMany.mockResolvedValueOnce({ count: 1 });

    const { DELETE } = await import("@/app/api/users/[id]/block/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/users/other-user-id/block`);
    const context = createMockParams({ id: "other-user-id" });
    const response = await DELETE(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.userBlock.deleteMany).toHaveBeenCalledWith({
      where: { blockerId: "test-user-id", blockedId: "other-user-id" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { DELETE } = await import("@/app/api/users/[id]/block/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/users/other-user-id/block`);
    const context = createMockParams({ id: "other-user-id" });
    const response = await DELETE(request, context);

    expect(response.status).toBe(401);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, createMockParams, BASE_URL } from "../../helpers/request";

beforeEach(() => {
  vi.clearAllMocks();
});

const MOCK_NOTIFICATION = {
  id: "notif-1",
  userId: "test-user-id",
  type: "MESSAGE",
  title: "New message",
  body: "You have a new message",
  isRead: false,
  createdAt: new Date().toISOString(),
};

// ── GET /api/notifications ────────────────────────────────────────

describe("GET /api/notifications", () => {
  it("returns notifications with unread count (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.notification.findMany.mockResolvedValueOnce([MOCK_NOTIFICATION]);
    mockPrisma.notification.count.mockResolvedValueOnce(3);

    const { GET } = await import("@/app/api/notifications/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/notifications`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.unreadCount).toBe(3);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/notifications/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/notifications`);
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

// ── PATCH /api/notifications/[id]/read ────────────────────────────

describe("PATCH /api/notifications/[id]/read", () => {
  it("marks a notification as read (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.notification.findUnique.mockResolvedValueOnce(MOCK_NOTIFICATION);
    mockPrisma.notification.update.mockResolvedValueOnce({ ...MOCK_NOTIFICATION, isRead: true });

    const { PATCH } = await import("@/app/api/notifications/[id]/read/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/notifications/notif-1/read`);
    const context = createMockParams({ id: "notif-1" });
    const response = await PATCH(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: "notif-1" },
      data: { isRead: true },
    });
  });

  it("returns 404 when not owner", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.notification.findUnique.mockResolvedValueOnce({
      ...MOCK_NOTIFICATION,
      userId: "other-user",
    });

    const { PATCH } = await import("@/app/api/notifications/[id]/read/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/notifications/notif-1/read`);
    const context = createMockParams({ id: "notif-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/notifications/[id]/read/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/notifications/notif-1/read`);
    const context = createMockParams({ id: "notif-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(401);
  });
});

// ── PATCH /api/notifications/read-all ─────────────────────────────

describe("PATCH /api/notifications/read-all", () => {
  it("marks all notifications as read (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.notification.updateMany.mockResolvedValueOnce({ count: 5 });

    const { PATCH } = await import("@/app/api/notifications/read-all/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/notifications/read-all`);
    const response = await PATCH(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "test-user-id", isRead: false },
      data: { isRead: true },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/notifications/read-all/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/notifications/read-all`);
    const response = await PATCH(request);

    expect(response.status).toBe(401);
  });
});

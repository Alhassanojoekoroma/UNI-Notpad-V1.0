import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, createMockParams, BASE_URL } from "../../helpers/request";

beforeEach(() => {
  vi.clearAllMocks();
});

const MOCK_ENTRY = {
  id: "sched-1",
  userId: "test-user-id",
  dayOfWeek: 1,
  startTime: "08:00",
  endTime: "10:00",
  subject: "Mathematics",
  location: "Room 101",
  type: "lecture",
  createdAt: new Date().toISOString(),
};

// ── GET /api/schedule ─────────────────────────────────────────────

describe("GET /api/schedule", () => {
  it("returns schedule entries (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.schedule.findMany.mockResolvedValueOnce([MOCK_ENTRY]);

    const { GET } = await import("@/app/api/schedule/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/schedule`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].subject).toBe("Mathematics");
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/schedule/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/schedule`);
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/schedule ────────────────────────────────────────────

describe("POST /api/schedule", () => {
  it("creates a schedule entry (201)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.schedule.create.mockResolvedValueOnce({ ...MOCK_ENTRY, id: "sched-new" });

    const { POST } = await import("@/app/api/schedule/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/schedule`, {
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "10:00",
      subject: "Mathematics",
    });
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockPrisma.schedule.create).toHaveBeenCalled();
  });

  it("returns 400 for invalid input", async () => {
    const { POST } = await import("@/app/api/schedule/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/schedule`, {
      dayOfWeek: 10,
      startTime: "invalid",
    });
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/schedule/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/schedule`, {
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "10:00",
      subject: "Mathematics",
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});

// ── PATCH /api/schedule/[id] ──────────────────────────────────────

describe("PATCH /api/schedule/[id]", () => {
  it("updates an entry owned by the user (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.schedule.findUnique.mockResolvedValueOnce(MOCK_ENTRY);
    mockPrisma.schedule.update.mockResolvedValueOnce({ ...MOCK_ENTRY, subject: "Physics" });

    const { PATCH } = await import("@/app/api/schedule/[id]/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/schedule/sched-1`, {
      subject: "Physics",
    });
    const context = createMockParams({ id: "sched-1" });
    const response = await PATCH(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.schedule.update).toHaveBeenCalled();
  });

  it("returns 404 when not owner", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.schedule.findUnique.mockResolvedValueOnce({ ...MOCK_ENTRY, userId: "other-user" });

    const { PATCH } = await import("@/app/api/schedule/[id]/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/schedule/sched-1`, {
      subject: "Physics",
    });
    const context = createMockParams({ id: "sched-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/schedule/[id]/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/schedule/sched-1`, {
      subject: "Physics",
    });
    const context = createMockParams({ id: "sched-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(401);
  });
});

// ── DELETE /api/schedule/[id] ─────────────────────────────────────

describe("DELETE /api/schedule/[id]", () => {
  it("deletes an entry owned by the user (200)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.schedule.findUnique.mockResolvedValueOnce(MOCK_ENTRY);
    mockPrisma.schedule.delete.mockResolvedValueOnce(MOCK_ENTRY);

    const { DELETE } = await import("@/app/api/schedule/[id]/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/schedule/sched-1`);
    const context = createMockParams({ id: "sched-1" });
    const response = await DELETE(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.schedule.delete).toHaveBeenCalledWith({ where: { id: "sched-1" } });
  });

  it("returns 404 when not owner", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.schedule.findUnique.mockResolvedValueOnce({ ...MOCK_ENTRY, userId: "other-user" });

    const { DELETE } = await import("@/app/api/schedule/[id]/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/schedule/sched-1`);
    const context = createMockParams({ id: "sched-1" });
    const response = await DELETE(request, context);

    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { DELETE } = await import("@/app/api/schedule/[id]/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/schedule/sched-1`);
    const context = createMockParams({ id: "sched-1" });
    const response = await DELETE(request, context);

    expect(response.status).toBe(401);
  });
});

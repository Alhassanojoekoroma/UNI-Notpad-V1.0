import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, createMockParams, BASE_URL } from "../../helpers/request";

// ── Shared setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

const MOCK_TASK = {
  id: "task-1",
  userId: "test-user-id",
  title: "Study for exam",
  description: "Review chapters 1-5",
  status: "PENDING",
  priority: "HIGH",
  deadline: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  invitations: [],
};

// ── GET /api/tasks ─────────────────────────────────────────────────

describe("GET /api/tasks", () => {
  it("returns the user's tasks", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.task.findMany.mockResolvedValueOnce([MOCK_TASK]);

    const { GET } = await import("@/app/api/tasks/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/tasks`);
    const response = await GET(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].title).toBe("Study for exam");
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/tasks/route");
    const request = createMockRequest("GET", `${BASE_URL}/api/tasks`);
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/tasks ────────────────────────────────────────────────

describe("POST /api/tasks", () => {
  it("creates a new task", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.task.create.mockResolvedValueOnce({ ...MOCK_TASK, id: "task-new" });

    const { POST } = await import("@/app/api/tasks/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/tasks`, {
      title: "Study for exam",
      description: "Review chapters 1-5",
      priority: "HIGH",
      deadline: new Date().toISOString(),
    });
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockPrisma.task.create).toHaveBeenCalled();
  });

  it("returns 400 for invalid input", async () => {
    const { POST } = await import("@/app/api/tasks/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/tasks`, {});
    const response = await POST(request);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/tasks/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/tasks`, {
      title: "Study for exam",
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});

// ── PATCH /api/tasks/[id] ──────────────────────────────────────────

describe("PATCH /api/tasks/[id]", () => {
  it("updates a task owned by the user", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.task.findUnique.mockResolvedValueOnce(MOCK_TASK);
    mockPrisma.task.update.mockResolvedValueOnce({
      ...MOCK_TASK,
      status: "COMPLETED",
      invitations: [],
    });

    const { PATCH } = await import("@/app/api/tasks/[id]/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/tasks/task-1`, {
      status: "COMPLETED",
    });
    const context = createMockParams({ id: "task-1" });
    const response = await PATCH(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.task.update).toHaveBeenCalled();
  });

  it("returns 404 when task is not owned by user", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.task.findUnique.mockResolvedValueOnce({
      ...MOCK_TASK,
      userId: "other-user-id",
    });

    const { PATCH } = await import("@/app/api/tasks/[id]/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/tasks/task-1`, {
      status: "COMPLETED",
    });
    const context = createMockParams({ id: "task-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/tasks/[id]/route");
    const request = createMockRequest("PATCH", `${BASE_URL}/api/tasks/task-1`, {
      status: "COMPLETED",
    });
    const context = createMockParams({ id: "task-1" });
    const response = await PATCH(request, context);

    expect(response.status).toBe(401);
  });
});

// ── DELETE /api/tasks/[id] ─────────────────────────────────────────

describe("DELETE /api/tasks/[id]", () => {
  it("deletes a task owned by the user", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.task.findUnique.mockResolvedValueOnce(MOCK_TASK);
    mockPrisma.task.delete.mockResolvedValueOnce(MOCK_TASK);

    const { DELETE } = await import("@/app/api/tasks/[id]/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/tasks/task-1`);
    const context = createMockParams({ id: "task-1" });
    const response = await DELETE(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: "task-1" } });
  });

  it("returns 404 when task is not owned by user", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.task.findUnique.mockResolvedValueOnce({
      ...MOCK_TASK,
      userId: "other-user-id",
    });

    const { DELETE } = await import("@/app/api/tasks/[id]/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/tasks/task-1`);
    const context = createMockParams({ id: "task-1" });
    const response = await DELETE(request, context);

    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { DELETE } = await import("@/app/api/tasks/[id]/route");
    const request = createMockRequest("DELETE", `${BASE_URL}/api/tasks/task-1`);
    const context = createMockParams({ id: "task-1" });
    const response = await DELETE(request, context);

    expect(response.status).toBe(401);
  });
});

// ── POST /api/tasks/[id]/invite ────────────────────────────────────

describe("POST /api/tasks/[id]/invite", () => {
  it("creates an invitation for the task", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.task.findUnique.mockResolvedValueOnce(MOCK_TASK);
    mockPrisma.taskInvitation.findUnique.mockResolvedValueOnce(null);
    mockPrisma.taskInvitation.create.mockResolvedValueOnce({
      id: "inv-1",
      taskId: "task-1",
      inviterId: "test-user-id",
      inviteeEmail: "friend@uni.edu",
    });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "friend-id",
      email: "friend@uni.edu",
    });

    const { POST } = await import("@/app/api/tasks/[id]/invite/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/tasks/task-1/invite`, {
      inviteeEmail: "friend@uni.edu",
    });
    const context = createMockParams({ id: "task-1" });
    const response = await POST(request, context);
    const json = await parseResponse<any>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockPrisma.taskInvitation.create).toHaveBeenCalled();
  });

  it("returns 404 when task is not owned by user", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mockPrisma = prisma as any;
    mockPrisma.task.findUnique.mockResolvedValueOnce({
      ...MOCK_TASK,
      userId: "other-user-id",
    });

    const { POST } = await import("@/app/api/tasks/[id]/invite/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/tasks/task-1/invite`, {
      inviteeEmail: "friend@uni.edu",
    });
    const context = createMockParams({ id: "task-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/tasks/[id]/invite/route");
    const request = createMockRequest("POST", `${BASE_URL}/api/tasks/task-1/invite`, {
      inviteeEmail: "friend@uni.edu",
    });
    const context = createMockParams({ id: "task-1" });
    const response = await POST(request, context);

    expect(response.status).toBe(401);
  });
});

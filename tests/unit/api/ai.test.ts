import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse, createMockParams, BASE_URL } from "../../helpers/request";

vi.mock("@/lib/ai-rate-limit", () => ({
  checkAndDeductAIQuery: vi.fn(),
  getAIQueryStatus: vi.fn(),
}));

let mockPrisma: any;
let mockAuth: any;
let mockRateLimit: any;

beforeEach(async () => {
  vi.clearAllMocks();
  mockPrisma = (await import("@/lib/prisma")).prisma as any;
  mockAuth = (await import("@/lib/auth")).auth as any;
  mockRateLimit = await import("@/lib/ai-rate-limit");
});

// ── POST /api/ai/query ─────────────────────────────────────────────

describe("POST /api/ai/query", () => {
  const url = `${BASE_URL}/api/ai/query`;

  const validBody = { query: "Explain photosynthesis" };

  it("unauthenticated -> 401", async () => {
    const { POST } = await import("@/app/api/ai/query/route");
    mockAuth.mockResolvedValueOnce(null);

    const response = await POST(createMockRequest("POST", url, validBody));
    expect(response.status).toBe(401);
  });

  it("rate limited -> 429", async () => {
    const { POST } = await import("@/app/api/ai/query/route");
    (mockRateLimit.checkAndDeductAIQuery as any).mockResolvedValueOnce({
      allowed: false,
      reason: "Daily limit reached",
      resetAt: null,
    });

    const response = await POST(createMockRequest("POST", url, validBody));
    const data = await parseResponse(response);
    expect(response.status).toBe(429);
    expect((data as any).error).toBe("Daily limit reached");
  });

  it("valid query returns streaming response", async () => {
    const { POST } = await import("@/app/api/ai/query/route");
    (mockRateLimit.checkAndDeductAIQuery as any).mockResolvedValueOnce({
      allowed: true,
      method: "free",
    });
    mockPrisma.aIInteraction.findMany.mockResolvedValue([]);
    mockPrisma.aIInteraction.create.mockResolvedValue({
      id: "interaction-1",
      conversationId: "conv-1",
    });

    const response = await POST(createMockRequest("POST", url, validBody));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });
});

// ── GET /api/ai/status ──────────────────────────────────────────────

describe("GET /api/ai/status", () => {
  const url = `${BASE_URL}/api/ai/status`;

  it("returns query status -> 200", async () => {
    const { GET } = await import("@/app/api/ai/status/route");
    (mockRateLimit.getAIQueryStatus as any).mockResolvedValueOnce({
      freeRemaining: 15,
      resetAt: null,
      tokenBalance: 50,
    });

    const response = await GET();
    const data = await parseResponse(response);
    expect(response.status).toBe(200);
    expect((data as any).data.freeRemaining).toBe(15);
    expect((data as any).data.tokenBalance).toBe(50);
  });

  it("unauthenticated -> 401", async () => {
    const { GET } = await import("@/app/api/ai/status/route");
    mockAuth.mockResolvedValueOnce(null);

    const response = await GET();
    expect(response.status).toBe(401);
  });
});

// ── GET /api/ai/history ─────────────────────────────────────────────

describe("GET /api/ai/history", () => {
  const url = `${BASE_URL}/api/ai/history`;

  it("returns conversations -> 200", async () => {
    const { GET } = await import("@/app/api/ai/history/route");
    const now = new Date();
    mockPrisma.aIInteraction.findMany.mockResolvedValue([
      { conversationId: "conv-1", query: "Hello AI", createdAt: now },
    ]);
    mockPrisma.aIInteraction.groupBy.mockResolvedValue([
      { conversationId: "conv-1", _count: { id: 3 }, _max: { createdAt: now } },
    ]);

    const response = await GET(createMockRequest("GET", url));
    const data = await parseResponse(response);
    expect(response.status).toBe(200);
    expect((data as any).data).toHaveLength(1);
    expect((data as any).data[0].conversationId).toBe("conv-1");
  });

  it("unauthenticated -> 401", async () => {
    const { GET } = await import("@/app/api/ai/history/route");
    mockAuth.mockResolvedValueOnce(null);

    const response = await GET(createMockRequest("GET", url));
    expect(response.status).toBe(401);
  });
});

// ── GET /api/ai/history/[id] ────────────────────────────────────────

describe("GET /api/ai/history/[id]", () => {
  it("returns conversation messages -> 200", async () => {
    const { GET } = await import("@/app/api/ai/history/[id]/route");
    mockPrisma.aIInteraction.findMany.mockResolvedValue([
      {
        id: "msg-1",
        query: "Hello",
        response: "Hi there",
        sourceContentIds: [],
        learningLevel: null,
        satisfactionRating: null,
        createdAt: new Date(),
      },
    ]);

    const request = createMockRequest("GET", `${BASE_URL}/api/ai/history/conv-1`);
    const response = await GET(request, createMockParams({ id: "conv-1" }));
    const data = await parseResponse(response);
    expect(response.status).toBe(200);
    expect((data as any).data).toHaveLength(1);
  });

  it("unauthenticated -> 401", async () => {
    const { GET } = await import("@/app/api/ai/history/[id]/route");
    mockAuth.mockResolvedValueOnce(null);

    const request = createMockRequest("GET", `${BASE_URL}/api/ai/history/conv-1`);
    const response = await GET(request, createMockParams({ id: "conv-1" }));
    expect(response.status).toBe(401);
  });
});

// ── DELETE /api/ai/history/[id] ─────────────────────────────────────

describe("DELETE /api/ai/history/[id]", () => {
  it("deletes conversation -> 200", async () => {
    const { DELETE } = await import("@/app/api/ai/history/[id]/route");
    mockPrisma.aIInteraction.findFirst.mockResolvedValue({ id: "msg-1" });
    mockPrisma.aIInteraction.deleteMany.mockResolvedValue({ count: 3 });

    const request = createMockRequest("DELETE", `${BASE_URL}/api/ai/history/conv-1`);
    const response = await DELETE(request, createMockParams({ id: "conv-1" }));
    const data = await parseResponse(response);
    expect(response.status).toBe(200);
    expect((data as any).success).toBe(true);
  });

  it("unauthenticated -> 401", async () => {
    const { DELETE } = await import("@/app/api/ai/history/[id]/route");
    mockAuth.mockResolvedValueOnce(null);

    const request = createMockRequest("DELETE", `${BASE_URL}/api/ai/history/conv-1`);
    const response = await DELETE(request, createMockParams({ id: "conv-1" }));
    expect(response.status).toBe(401);
  });
});

// ── PATCH /api/ai/history/[id]/rate ─────────────────────────────────

describe("PATCH /api/ai/history/[id]/rate", () => {
  it("valid rating -> 200", async () => {
    const { PATCH } = await import("@/app/api/ai/history/[id]/rate/route");
    mockPrisma.aIInteraction.findFirst.mockResolvedValue({ id: "interaction-1" });
    mockPrisma.aIInteraction.update.mockResolvedValue({ id: "interaction-1", satisfactionRating: 4 });

    const request = createMockRequest("PATCH", `${BASE_URL}/api/ai/history/interaction-1/rate`, { rating: 4 });
    const response = await PATCH(request, createMockParams({ id: "interaction-1" }));
    const data = await parseResponse(response);
    expect(response.status).toBe(200);
    expect((data as any).success).toBe(true);
  });

  it("unauthenticated -> 401", async () => {
    const { PATCH } = await import("@/app/api/ai/history/[id]/rate/route");
    mockAuth.mockResolvedValueOnce(null);

    const request = createMockRequest("PATCH", `${BASE_URL}/api/ai/history/interaction-1/rate`, { rating: 4 });
    const response = await PATCH(request, createMockParams({ id: "interaction-1" }));
    expect(response.status).toBe(401);
  });
});

// ── POST /api/ai/quiz-score ─────────────────────────────────────────

describe("POST /api/ai/quiz-score", () => {
  const url = `${BASE_URL}/api/ai/quiz-score`;

  const validScore = {
    module: "Biology 101",
    quizType: "mcq",
    score: 8,
    totalQuestions: 10,
  };

  it("valid score -> 200", async () => {
    const { POST } = await import("@/app/api/ai/quiz-score/route");
    mockPrisma.quizScore.create.mockResolvedValue({
      id: "score-1",
      userId: "test-user-id",
      ...validScore,
    });

    const response = await POST(createMockRequest("POST", url, validScore));
    const data = await parseResponse(response);
    expect(response.status).toBe(200);
    expect((data as any).success).toBe(true);
    expect((data as any).data.score).toBe(8);
  });

  it("unauthenticated -> 401", async () => {
    const { POST } = await import("@/app/api/ai/quiz-score/route");
    mockAuth.mockResolvedValueOnce(null);

    const response = await POST(createMockRequest("POST", url, validScore));
    expect(response.status).toBe(401);
  });
});

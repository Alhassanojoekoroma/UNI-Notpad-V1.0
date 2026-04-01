import { describe, it, expect, vi, beforeEach } from "vitest";

vi.unmock("@/lib/ai-rate-limit");

import { checkAndDeductAIQuery, getAIQueryStatus } from "@/lib/ai-rate-limit";
import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkAndDeductAIQuery", () => {
  it("allows query when free queries remain", async () => {
    // $transaction calls the callback with the mock prisma
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      freeQueriesRemaining: 10,
      freeQueriesResetAt: null,
    });
    mockPrisma.appSettings.findFirst.mockResolvedValue({
      freeQueriesPerDay: 20,
      freeSuspensionHours: 7,
    });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await checkAndDeductAIQuery("user-1");
    expect(result).toEqual({ allowed: true, method: "free" });
  });

  it("sets reset time when last free query is used", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      freeQueriesRemaining: 1,
      freeQueriesResetAt: null,
    });
    mockPrisma.appSettings.findFirst.mockResolvedValue({
      freeQueriesPerDay: 20,
      freeSuspensionHours: 7,
    });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await checkAndDeductAIQuery("user-1");
    expect(result).toEqual({ allowed: true, method: "free" });
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          freeQueriesRemaining: 0,
          freeQueriesResetAt: expect.any(Date),
        }),
      })
    );
  });

  it("uses tokens when free queries exhausted", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      freeQueriesRemaining: 0,
      freeQueriesResetAt: new Date(Date.now() + 3600000),
    });
    mockPrisma.appSettings.findFirst.mockResolvedValue({
      freeQueriesPerDay: 20,
      freeSuspensionHours: 7,
    });
    mockPrisma.tokenBalance.findUnique.mockResolvedValue({
      userId: "user-1",
      available: 5,
    });
    mockPrisma.tokenBalance.update.mockResolvedValue({});
    mockPrisma.tokenTransaction.create.mockResolvedValue({});

    const result = await checkAndDeductAIQuery("user-1");
    expect(result).toEqual({ allowed: true, method: "token" });
  });

  it("rejects when no free queries and no tokens", async () => {
    const resetAt = new Date(Date.now() + 3600000);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      freeQueriesRemaining: 0,
      freeQueriesResetAt: resetAt,
    });
    mockPrisma.appSettings.findFirst.mockResolvedValue({
      freeQueriesPerDay: 20,
      freeSuspensionHours: 7,
    });
    mockPrisma.tokenBalance.findUnique.mockResolvedValue(null);

    const result = await checkAndDeductAIQuery("user-1");
    expect(result).toEqual({
      allowed: false,
      reason: expect.stringContaining("No queries remaining"),
      resetAt,
    });
  });

  it("resets free queries when suspension period has passed", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      freeQueriesRemaining: 0,
      freeQueriesResetAt: new Date(Date.now() - 1000), // in the past
    });
    mockPrisma.appSettings.findFirst.mockResolvedValue({
      freeQueriesPerDay: 20,
      freeSuspensionHours: 7,
    });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await checkAndDeductAIQuery("user-1");
    expect(result).toEqual({ allowed: true, method: "free" });
    // First call resets, second call deducts
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
  });
});

describe("getAIQueryStatus", () => {
  it("returns current query status", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      freeQueriesRemaining: 15,
      freeQueriesResetAt: null,
    });
    mockPrisma.tokenBalance.findUnique.mockResolvedValue({
      available: 50,
    });

    const result = await getAIQueryStatus("user-1");
    expect(result).toEqual({
      freeRemaining: 15,
      resetAt: null,
      tokenBalance: 50,
    });
  });

  it("returns 0 token balance when no balance record", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      freeQueriesRemaining: 5,
      freeQueriesResetAt: null,
    });
    mockPrisma.tokenBalance.findUnique.mockResolvedValue(null);

    const result = await getAIQueryStatus("user-1");
    expect(result.tokenBalance).toBe(0);
  });

  it("shows reset as available when reset time has passed", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      freeQueriesRemaining: 0,
      freeQueriesResetAt: new Date(Date.now() - 1000),
    });
    mockPrisma.tokenBalance.findUnique.mockResolvedValue(null);
    mockPrisma.appSettings.findFirst.mockResolvedValue({
      freeQueriesPerDay: 20,
    });

    const result = await getAIQueryStatus("user-1");
    expect(result.freeRemaining).toBe(20);
    expect(result.resetAt).toBeNull();
  });
});

/**
 * Integration tests for AI rate limiting and interaction history.
 * Uses a real test database — no Prisma mocks.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import {
  testPrisma,
  setupTestDatabase,
  teardownTestDatabase,
  cleanupDatabase,
} from "../helpers/db";
import {
  createTestUser,
  createTestAppSettings,
  createTestFaculty,
  createTestProgram,
  createTestTokenBalance,
  resetFixtureCounter,
} from "../helpers/fixtures";

beforeAll(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  resetFixtureCounter();
  await cleanupDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

/** Seed faculty, program, and a user */
async function seedUser(overrides: Record<string, unknown> = {}) {
  const faculty = await testPrisma.faculty.create({
    data: { id: "test-faculty-id", name: "Engineering", code: "ENG" },
  });
  await testPrisma.program.create({
    data: {
      id: "test-program-id",
      name: "Computer Science",
      code: "CS",
      facultyId: faculty.id,
    },
  });
  const user = await testPrisma.user.create({
    data: createTestUser(overrides),
  });
  return { faculty, user };
}

describe("AI rate limiting flow", () => {
  it("should track free query depletion and token-based fallback", async () => {
    // 1. Create AppSettings with low free query limit
    await testPrisma.appSettings.create({
      data: createTestAppSettings({ freeQueriesPerDay: 3 }),
    });

    // 2. Create user with 1 free query remaining
    const { user } = await seedUser({ freeQueriesRemaining: 1 });
    expect(user.freeQueriesRemaining).toBe(1);

    // 3. Decrement free queries to 0 and set reset time
    const resetAt = new Date(Date.now() + 7 * 3600_000); // 7 hours from now
    const depleted = await testPrisma.user.update({
      where: { id: user.id },
      data: { freeQueriesRemaining: 0, freeQueriesResetAt: resetAt },
    });
    expect(depleted.freeQueriesRemaining).toBe(0);
    expect(depleted.freeQueriesResetAt).toBeInstanceOf(Date);

    // 4. Create token balance as paid fallback
    await testPrisma.tokenBalance.create({
      data: createTestTokenBalance({
        userId: user.id,
        available: 5,
        used: 0,
        total: 5,
      }),
    });

    // 5. Simulate a paid query — deduct 1 token
    const balance = await testPrisma.tokenBalance.update({
      where: { userId: user.id },
      data: { available: { decrement: 1 }, used: { increment: 1 } },
    });
    expect(balance.available).toBe(4);
    expect(balance.used).toBe(1);

    // 6. Create a token transaction record
    const tx = await testPrisma.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: -1,
        type: "USAGE",
        status: "COMPLETED",
        metadata: { queryType: "chat", conversationId: "conv-123" },
      },
    });
    expect(tx.type).toBe("USAGE");
    expect(tx.status).toBe("COMPLETED");

    // 7. Verify final balance
    const finalBalance = await testPrisma.tokenBalance.findUnique({
      where: { userId: user.id },
    });
    expect(finalBalance!.available).toBe(4);
    expect(finalBalance!.used).toBe(1);
    expect(finalBalance!.total).toBe(5);
  });

  it("should reset free queries after cooldown period", async () => {
    await testPrisma.appSettings.create({
      data: createTestAppSettings({ freeQueriesPerDay: 3 }),
    });

    // User whose reset time has passed
    const pastReset = new Date(Date.now() - 3600_000); // 1 hour ago
    const { user } = await seedUser({
      freeQueriesRemaining: 0,
      freeQueriesResetAt: pastReset,
    });

    // Check if reset is due
    const dbUser = await testPrisma.user.findUnique({
      where: { id: user.id },
    });
    const resetIsDue =
      dbUser!.freeQueriesResetAt !== null &&
      dbUser!.freeQueriesResetAt.getTime() < Date.now();
    expect(resetIsDue).toBe(true);

    // Perform the reset
    const settings = await testPrisma.appSettings.findFirst();
    const reset = await testPrisma.user.update({
      where: { id: user.id },
      data: {
        freeQueriesRemaining: settings!.freeQueriesPerDay,
        freeQueriesResetAt: null,
      },
    });
    expect(reset.freeQueriesRemaining).toBe(3);
    expect(reset.freeQueriesResetAt).toBeNull();
  });
});

describe("AI interaction history", () => {
  it("should store and retrieve conversation threads", async () => {
    const { user } = await seedUser();
    const conversationId = "conv-thread-001";

    // Create multiple interactions in the same conversation
    const interactions = [
      {
        userId: user.id,
        conversationId,
        query: "What is binary search?",
        response: "Binary search is a divide-and-conquer algorithm...",
        queryType: "chat",
        sourceContentIds: [],
        tokensUsed: 1,
      },
      {
        userId: user.id,
        conversationId,
        query: "Can you give me an example?",
        response: "Consider a sorted array [1, 3, 5, 7, 9]...",
        queryType: "chat",
        sourceContentIds: [],
        tokensUsed: 1,
      },
      {
        userId: user.id,
        conversationId,
        query: "What is the time complexity?",
        response: "The time complexity is O(log n)...",
        queryType: "chat",
        sourceContentIds: [],
        tokensUsed: 1,
      },
    ];

    for (const data of interactions) {
      await testPrisma.aIInteraction.create({ data });
    }

    // Query by conversationId
    const thread = await testPrisma.aIInteraction.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    expect(thread).toHaveLength(3);
    expect(thread[0].query).toBe("What is binary search?");
    expect(thread[2].query).toBe("What is the time complexity?");

    // Delete entire conversation
    await testPrisma.aIInteraction.deleteMany({ where: { conversationId } });

    const afterDelete = await testPrisma.aIInteraction.findMany({
      where: { conversationId },
    });
    expect(afterDelete).toHaveLength(0);
  });

  it("should track interactions across different conversations for a user", async () => {
    const { user } = await seedUser();

    await testPrisma.aIInteraction.create({
      data: {
        userId: user.id,
        conversationId: "conv-a",
        query: "Question A",
        response: "Answer A",
        queryType: "chat",
        sourceContentIds: [],
      },
    });
    await testPrisma.aIInteraction.create({
      data: {
        userId: user.id,
        conversationId: "conv-b",
        query: "Question B",
        response: "Answer B",
        queryType: "study_guide",
        sourceContentIds: ["content-1"],
      },
    });

    // All interactions for this user
    const all = await testPrisma.aIInteraction.findMany({
      where: { userId: user.id },
    });
    expect(all).toHaveLength(2);

    // Filter by queryType
    const studyGuides = await testPrisma.aIInteraction.findMany({
      where: { userId: user.id, queryType: "study_guide" },
    });
    expect(studyGuides).toHaveLength(1);
    expect(studyGuides[0].sourceContentIds).toContain("content-1");
  });
});

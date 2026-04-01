import { vi } from "vitest";

const modelMethods = [
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
] as const;

const modelNames = [
  "account",
  "session",
  "verificationToken",
  "user",
  "faculty",
  "program",
  "content",
  "contentAccess",
  "contentRating",
  "aIInteraction",
  "message",
  "userBlock",
  "task",
  "taskInvitation",
  "schedule",
  "tokenBalance",
  "tokenTransaction",
  "referral",
  "quizScore",
  "learningGoal",
  "forumPost",
  "forumVote",
  "contentFlag",
  "userReport",
  "notification",
  "lecturerCode",
  "auditLog",
  "appSettings",
] as const;

function createModelMock() {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of modelMethods) {
    mock[method] = vi.fn();
  }
  return mock;
}

export function createPrismaMock() {
  const prisma: Record<string, unknown> = {};

  for (const model of modelNames) {
    prisma[model] = createModelMock();
  }

  // $transaction calls the callback with the mock itself
  prisma.$transaction = vi.fn().mockImplementation(async (fnOrArray) => {
    if (typeof fnOrArray === "function") {
      return fnOrArray(prisma);
    }
    // Array of promises
    return Promise.all(fnOrArray);
  });

  prisma.$queryRaw = vi.fn();
  prisma.$executeRaw = vi.fn();
  prisma.$queryRawUnsafe = vi.fn();
  prisma.$executeRawUnsafe = vi.fn();
  prisma.$connect = vi.fn();
  prisma.$disconnect = vi.fn();

  return prisma;
}

/** Get the mocked prisma instance from the mocked module */
export function getPrismaMock() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require("@/lib/prisma");
  return prisma as ReturnType<typeof createPrismaMock>;
}

/**
 * Test database utilities for integration tests.
 * Uses a separate test database to avoid corrupting dev data.
 */
import { PrismaClient } from "@prisma/client";

const DATABASE_URL = process.env.DATABASE_URL_TEST;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL_TEST must be set for integration tests. Refusing to use DATABASE_URL because cleanup truncates every application table."
  );
}

export const testPrisma = new PrismaClient({
  datasourceUrl: DATABASE_URL,
});

const allTables = [
  "AuditLog",
  "LecturerCode",
  "Notification",
  "UserReport",
  "ContentFlag",
  "ForumVote",
  "ForumPost",
  "LearningGoal",
  "QuizScore",
  "Referral",
  "TokenTransaction",
  "TokenBalance",
  "Schedule",
  "TaskInvitation",
  "Task",
  "UserBlock",
  "Message",
  "AIInteraction",
  "ContentRating",
  "ContentAccess",
  "Content",
  "Program",
  "Faculty",
  "VerificationToken",
  "Session",
  "Account",
  "User",
  "AppSettings",
] as const;

/** Truncate all tables — fast cleanup between integration tests */
export async function cleanupDatabase() {
  const tableList = allTables.map((t) => `"${t}"`).join(", ");
  await testPrisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} CASCADE`
  );
}

/** Connect to test database */
export async function setupTestDatabase() {
  await testPrisma.$connect();
}

/** Disconnect from test database */
export async function teardownTestDatabase() {
  await cleanupDatabase();
  await testPrisma.$disconnect();
}

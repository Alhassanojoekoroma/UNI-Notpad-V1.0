/**
 * Integration tests for content lifecycle and flagging flows.
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
  createTestLecturer,
  createTestAdmin,
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

/** Helper to seed faculty, program, and users for content tests */
async function seedContentPrerequisites() {
  const faculty = await testPrisma.faculty.create({
    data: { id: "fac-1", name: "Engineering", code: "ENG", isActive: true },
  });
  const program = await testPrisma.program.create({
    data: {
      id: "prog-1",
      name: "Computer Science",
      code: "CS",
      facultyId: faculty.id,
      isActive: true,
    },
  });
  const lecturer = await testPrisma.user.create({
    data: createTestLecturer({
      id: "lecturer-1",
      facultyId: faculty.id,
      programId: program.id,
    }),
  });
  const student = await testPrisma.user.create({
    data: createTestUser({
      id: "student-1",
      facultyId: faculty.id,
      programId: program.id,
    }),
  });
  return { faculty, program, lecturer, student };
}

/** Build content data matching the actual Prisma schema fields */
function buildContentData(overrides: Record<string, unknown> = {}) {
  return {
    title: "Test Content",
    description: "Test content description",
    module: "Test Module",
    moduleCode: "TM101",
    fileUrl: "https://res.cloudinary.com/test/file.pdf",
    filePublicId: "test-public-id",
    fileType: "pdf",
    fileSize: 1024000,
    contentType: "LECTURE_NOTES" as const,
    semester: 1,
    viewCount: 0,
    downloadCount: 0,
    status: "ACTIVE" as const,
    version: 1,
    ...overrides,
  };
}

describe("Content lifecycle flow", () => {
  it("should create content and filter by faculty and semester", async () => {
    const { faculty, lecturer } = await seedContentPrerequisites();

    // Create content using relation-style connect for FK fields
    const content = await testPrisma.content.create({
      data: {
        ...buildContentData({ semester: 2 }),
        faculty: { connect: { id: faculty.id } },
        lecturer: { connect: { id: lecturer.id } },
      },
    });

    // Query content filtered by faculty + semester
    const results = await testPrisma.content.findMany({
      where: { facultyId: faculty.id, semester: 2, status: "ACTIVE" },
    });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe(content.title);

    // Different semester should return nothing
    const empty = await testPrisma.content.findMany({
      where: { facultyId: faculty.id, semester: 3, status: "ACTIVE" },
    });
    expect(empty).toHaveLength(0);
  });

  it("should track ratings and content access records", async () => {
    const { faculty, lecturer, student } = await seedContentPrerequisites();

    const content = await testPrisma.content.create({
      data: {
        ...buildContentData(),
        faculty: { connect: { id: faculty.id } },
        lecturer: { connect: { id: lecturer.id } },
      },
    });

    // Student rates the content
    await testPrisma.contentRating.create({
      data: {
        contentId: content.id,
        userId: student.id,
        rating: 4,
        feedbackText: "Very helpful notes",
      },
    });

    // Verify rating exists with unique constraint
    const rating = await testPrisma.contentRating.findUnique({
      where: {
        contentId_userId: { contentId: content.id, userId: student.id },
      },
    });
    expect(rating).not.toBeNull();
    expect(rating!.rating).toBe(4);

    // Create access records (views + downloads)
    await testPrisma.contentAccess.createMany({
      data: [
        { contentId: content.id, userId: student.id, accessType: "view" },
        { contentId: content.id, userId: student.id, accessType: "view" },
        { contentId: content.id, userId: student.id, accessType: "download" },
      ],
    });

    // Update content counters (mimicking what the app does)
    await testPrisma.content.update({
      where: { id: content.id },
      data: { viewCount: 2, downloadCount: 1, averageRating: 4 },
    });

    const updated = await testPrisma.content.findUnique({
      where: { id: content.id },
    });
    expect(updated!.viewCount).toBe(2);
    expect(updated!.downloadCount).toBe(1);
    expect(updated!.averageRating).toBe(4);
  });
});

describe("Content flag flow", () => {
  it("should flag content, resolve it, and exclude archived content from active queries", async () => {
    const { faculty, lecturer, student } = await seedContentPrerequisites();
    const admin = await testPrisma.user.create({
      data: createTestAdmin({
        id: "admin-1",
        facultyId: faculty.id,
        programId: null,
      }),
    });

    const content = await testPrisma.content.create({
      data: {
        ...buildContentData(),
        faculty: { connect: { id: faculty.id } },
        lecturer: { connect: { id: lecturer.id } },
      },
    });

    // Student flags the content
    const flag = await testPrisma.contentFlag.create({
      data: {
        contentId: content.id,
        reporterId: student.id,
        reason: "Contains incorrect information",
      },
    });
    expect(flag.status).toBe("PENDING");

    // Admin resolves the flag
    const resolved = await testPrisma.contentFlag.update({
      where: { id: flag.id },
      data: {
        status: "RESOLVED",
        reviewedBy: admin.id,
        adminNotes: "Content verified as inaccurate, archiving.",
        resolvedAt: new Date(),
      },
    });
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.reviewedBy).toBe(admin.id);

    // Archive the content
    await testPrisma.content.update({
      where: { id: content.id },
      data: { status: "ARCHIVED" },
    });

    // Query active content — flagged/archived content should not appear
    const activeContent = await testPrisma.content.findMany({
      where: { facultyId: faculty.id, status: "ACTIVE" },
    });
    expect(activeContent).toHaveLength(0);

    // But it still exists in the database
    const allContent = await testPrisma.content.findMany({
      where: { facultyId: faculty.id },
    });
    expect(allContent).toHaveLength(1);
    expect(allContent[0].status).toBe("ARCHIVED");
  });
});

/**
 * Integration tests for admin operations: lecturer codes and user management.
 * Uses a real test database — no Prisma mocks.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import {
  testPrisma,
  setupTestDatabase,
  teardownTestDatabase,
  cleanupDatabase,
} from "../helpers/db";
import {
  createTestUser,
  createTestAdmin,
  createTestLecturer,
  createTestFaculty,
  createTestProgram,
  resetFixtureCounter,
} from "../helpers/fixtures";

// Unmock bcryptjs for real hashing in lecturer code tests
vi.unmock("bcryptjs");
import bcrypt from "bcryptjs";

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

/** Seed faculty, program, and admin user */
async function seedAdmin() {
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
  const admin = await testPrisma.user.create({
    data: createTestAdmin({ id: "admin-1", facultyId: faculty.id }),
  });
  return { faculty, admin };
}

describe("Lecturer code flow", () => {
  it("should create, validate, and revoke a lecturer registration code", async () => {
    const { faculty, admin } = await seedAdmin();

    // 1. Create a lecturer code with hashed value
    const rawCode = "LECT-2026-ABCDE";
    const hashedCode = await bcrypt.hash(rawCode, 12);

    const lecturerCode = await testPrisma.lecturerCode.create({
      data: {
        code: hashedCode,
        facultyId: faculty.id,
        lecturerName: "Dr. Jane Smith",
        isActive: true,
        createdBy: admin.id,
      },
    });
    expect(lecturerCode.isActive).toBe(true);
    expect(lecturerCode.revokedAt).toBeNull();

    // 2. Verify the code can be found and validated
    const allCodes = await testPrisma.lecturerCode.findMany({
      where: { isActive: true },
    });
    expect(allCodes).toHaveLength(1);

    // In production, you'd iterate and bcrypt.compare against each
    const isValid = await bcrypt.compare(rawCode, allCodes[0].code);
    expect(isValid).toBe(true);

    // 3. Simulate a lecturer registering with the code
    const lecturer = await testPrisma.user.create({
      data: createTestLecturer({
        id: "lecturer-1",
        name: "Dr. Jane Smith",
        facultyId: faculty.id,
      }),
    });
    expect(lecturer.role).toBe("LECTURER");

    // 4. Revoke the code after use
    const revoked = await testPrisma.lecturerCode.update({
      where: { id: lecturerCode.id },
      data: { isActive: false, revokedAt: new Date() },
    });
    expect(revoked.isActive).toBe(false);
    expect(revoked.revokedAt).toBeInstanceOf(Date);

    // 5. Verify no active codes remain
    const activeCodes = await testPrisma.lecturerCode.findMany({
      where: { isActive: true },
    });
    expect(activeCodes).toHaveLength(0);
  });
});

describe("User management flow", () => {
  it("should change user role and persist it", async () => {
    const { faculty, admin } = await seedAdmin();

    // Create a regular student
    const student = await testPrisma.user.create({
      data: createTestUser({ id: "student-1", facultyId: faculty.id }),
    });
    expect(student.role).toBe("STUDENT");

    // Admin promotes to LECTURER
    const promoted = await testPrisma.user.update({
      where: { id: student.id },
      data: { role: "LECTURER", studentId: null },
    });
    expect(promoted.role).toBe("LECTURER");

    // Verify persistence
    const reloaded = await testPrisma.user.findUnique({
      where: { id: student.id },
    });
    expect(reloaded!.role).toBe("LECTURER");
  });

  it("should soft delete a user and exclude them from active queries", async () => {
    const { faculty, admin } = await seedAdmin();

    const user = await testPrisma.user.create({
      data: createTestUser({ id: "student-1", facultyId: faculty.id }),
    });

    // Soft delete
    const deletedAt = new Date();
    await testPrisma.user.update({
      where: { id: user.id },
      data: { deletedAt, isActive: false },
    });

    // Active users query excludes soft-deleted users
    const activeUsers = await testPrisma.user.findMany({
      where: { deletedAt: null, role: "STUDENT" },
    });
    const ids = activeUsers.map((u) => u.id);
    expect(ids).not.toContain(user.id);

    // But the user still exists in the DB
    const softDeleted = await testPrisma.user.findUnique({
      where: { id: user.id },
    });
    expect(softDeleted).not.toBeNull();
    expect(softDeleted!.deletedAt).toBeInstanceOf(Date);
    expect(softDeleted!.isActive).toBe(false);
  });

  it("should create audit log entries for admin actions", async () => {
    const { faculty, admin } = await seedAdmin();

    const user = await testPrisma.user.create({
      data: createTestUser({ id: "student-1", facultyId: faculty.id }),
    });

    // Log role change
    await testPrisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "user.role_changed",
        entityType: "user",
        entityId: user.id,
        metadata: { from: "STUDENT", to: "LECTURER" },
        ipAddress: "127.0.0.1",
      },
    });

    // Log soft delete
    await testPrisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "user.soft_deleted",
        entityType: "user",
        entityId: user.id,
        metadata: { reason: "Account deactivation request" },
        ipAddress: "127.0.0.1",
      },
    });

    // Verify audit trail
    const logs = await testPrisma.auditLog.findMany({
      where: { entityType: "user", entityId: user.id },
      orderBy: { createdAt: "asc" },
    });
    expect(logs).toHaveLength(2);
    expect(logs[0].action).toBe("user.role_changed");
    expect(logs[1].action).toBe("user.soft_deleted");

    // Verify metadata is stored correctly
    const roleChangeLog = logs[0];
    const meta = roleChangeLog.metadata as Record<string, string>;
    expect(meta.from).toBe("STUDENT");
    expect(meta.to).toBe("LECTURER");

    // Verify logs are tied to the admin
    expect(logs.every((l) => l.userId === admin.id)).toBe(true);
  });
});

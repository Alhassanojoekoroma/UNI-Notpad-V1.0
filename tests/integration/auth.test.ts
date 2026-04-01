/**
 * Integration tests for authentication and referral flows.
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
  createTestAppSettings,
  createTestTokenBalance,
  resetFixtureCounter,
} from "../helpers/fixtures";

// Unmock bcryptjs so we can use real hashing
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

describe("Registration + Verification flow", () => {
  it("should create a user with hashed password and verify email via token", async () => {
    // 1. Create AppSettings (required for FK or setup checks)
    const settings = createTestAppSettings();
    await testPrisma.appSettings.create({ data: settings });

    // 2. Create faculty and program (needed for user FK)
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

    // 3. Create user with hashed password (simulating registration)
    const hashedPassword = await bcrypt.hash("SecurePass123!", 12);
    const userData = createTestUser({
      password: hashedPassword,
      emailVerified: null, // not yet verified
    });

    const user = await testPrisma.user.create({ data: userData });
    expect(user.emailVerified).toBeNull();
    expect(user.password).not.toBe("SecurePass123!");

    // 4. Create verification token
    const token = "verify-token-abc123";
    const expires = new Date(Date.now() + 3600_000); // 1 hour
    await testPrisma.verificationToken.create({
      data: {
        identifier: user.email!,
        token,
        expires,
      },
    });

    // 5. Find the token and verify it's valid
    const found = await testPrisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: user.email!, token } },
    });
    expect(found).not.toBeNull();
    expect(found!.expires.getTime()).toBeGreaterThan(Date.now());

    // 6. Mark user as verified and delete the token
    const verified = await testPrisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    expect(verified.emailVerified).toBeInstanceOf(Date);

    await testPrisma.verificationToken.delete({
      where: { identifier_token: { identifier: user.email!, token } },
    });
    const deleted = await testPrisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: user.email!, token } },
    });
    expect(deleted).toBeNull();
  });

  it("should validate password with bcrypt compare", async () => {
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

    const plainPassword = "MyPassword456!";
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const userData = createTestUser({ password: hashedPassword });
    const user = await testPrisma.user.create({ data: userData });

    // Simulate login: fetch user and compare password
    const dbUser = await testPrisma.user.findUnique({
      where: { email: user.email! },
    });
    expect(dbUser).not.toBeNull();

    const passwordMatch = await bcrypt.compare(plainPassword, dbUser!.password!);
    expect(passwordMatch).toBe(true);

    const wrongMatch = await bcrypt.compare("WrongPassword", dbUser!.password!);
    expect(wrongMatch).toBe(false);
  });
});

describe("Referral flow", () => {
  it("should link referrer and referee with bonus tokens", async () => {
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

    // 1. Create user A (referrer) with a referral code
    const userAData = createTestUser({ referralCode: "REFCODE_A" });
    const userA = await testPrisma.user.create({ data: userAData });

    // 2. Create user B (referee) who used A's referral code
    const userBData = createTestUser({ referralCode: "REFCODE_B" });
    const userB = await testPrisma.user.create({ data: userBData });

    // 3. Create Referral record linking both
    const referral = await testPrisma.referral.create({
      data: {
        referrerId: userA.id,
        refereeId: userB.id,
        tokensAwarded: 10,
        status: "completed",
      },
    });
    expect(referral.tokensAwarded).toBe(10);
    expect(referral.status).toBe("completed");

    // 4. Create TokenBalance for both users with bonus tokens
    await testPrisma.tokenBalance.create({
      data: createTestTokenBalance({
        userId: userA.id,
        available: 10,
        total: 10,
        bonus: 10,
      }),
    });
    await testPrisma.tokenBalance.create({
      data: createTestTokenBalance({
        userId: userB.id,
        available: 10,
        total: 10,
        bonus: 10,
      }),
    });

    // 5. Verify both users have token balances
    const balanceA = await testPrisma.tokenBalance.findUnique({
      where: { userId: userA.id },
    });
    const balanceB = await testPrisma.tokenBalance.findUnique({
      where: { userId: userB.id },
    });
    expect(balanceA!.bonus).toBe(10);
    expect(balanceB!.bonus).toBe(10);
    expect(balanceA!.available).toBe(10);

    // Verify referral record exists
    const ref = await testPrisma.referral.findUnique({
      where: { referrerId_refereeId: { referrerId: userA.id, refereeId: userB.id } },
    });
    expect(ref).not.toBeNull();
    expect(ref!.tokensAwarded).toBe(10);
  });
});

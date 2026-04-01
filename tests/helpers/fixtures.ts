/**
 * Factory functions for creating test data.
 * Each function returns a plain object matching the Prisma model shape.
 * Pass overrides to customize specific fields.
 */

let counter = 0;
function nextId() {
  return `test-${++counter}`;
}

// Reset counter between test files if needed
export function resetFixtureCounter() {
  counter = 0;
}

// ── User fixtures ───────────────────────────────────────────────────

export function createTestUser(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    email: `user-${id}@test.com`,
    name: `Test User ${id}`,
    role: "STUDENT" as const,
    emailVerified: new Date(),
    password: "$2a$12$mockedhash",
    studentId: `90500${id.replace(/\D/g, "").padStart(4, "0")}`,
    facultyId: "test-faculty-id",
    programId: "test-program-id",
    semester: 1,
    referralCode: `REF${id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5)}`,
    freeQueriesRemaining: 20,
    freeQueriesResetAt: null,
    isSuspended: false,
    isActive: true,
    deletedAt: null,
    ...overrides,
  };
}

export function createTestAdmin(overrides: Record<string, unknown> = {}) {
  return createTestUser({ role: "ADMIN", studentId: null, ...overrides });
}

export function createTestLecturer(overrides: Record<string, unknown> = {}) {
  return createTestUser({ role: "LECTURER", studentId: null, ...overrides });
}

// ── Session fixture ─────────────────────────────────────────────────

export function createTestSession(user: Record<string, unknown>) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      facultyId: user.facultyId ?? "test-faculty-id",
      semester: user.semester ?? 1,
      image: user.image ?? null,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

// ── Content fixtures ────────────────────────────────────────────────

export function createTestContent(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    title: `Test Content ${id}`,
    description: "Test content description",
    module: "Test Module",
    moduleCode: "TM101",
    fileUrl: `https://res.cloudinary.com/test/${id}.pdf`,
    fileType: "PDF",
    fileSize: 1024000,
    cloudinaryPublicId: `test-${id}`,
    facultyId: "test-faculty-id",
    semester: 1,
    uploaderId: "test-lecturer-id",
    status: "ACTIVE" as const,
    viewCount: 0,
    downloadCount: 0,
    averageRating: 0,
    ratingCount: 0,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Message fixture ─────────────────────────────────────────────────

export function createTestMessage(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    senderId: "test-sender-id",
    recipientId: "test-recipient-id",
    subject: `Test Subject ${id}`,
    body: "Test message body",
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Task fixture ────────────────────────────────────────────────────

export function createTestTask(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    title: `Test Task ${id}`,
    description: "Test task description",
    userId: "test-user-id",
    status: "PENDING" as const,
    priority: "MEDIUM" as const,
    dueDate: new Date(Date.now() + 7 * 86400000),
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Faculty fixture ─────────────────────────────────────────────────

export function createTestFaculty(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    name: `Faculty of ${id}`,
    code: `FAC${id.replace(/\D/g, "")}`,
    isActive: true,
    ...overrides,
  };
}

// ── Program fixture ─────────────────────────────────────────────────

export function createTestProgram(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    name: `Program ${id}`,
    code: `PRG${id.replace(/\D/g, "")}`,
    facultyId: "test-faculty-id",
    isActive: true,
    ...overrides,
  };
}

// ── TokenBalance fixture ────────────────────────────────────────────

export function createTestTokenBalance(overrides: Record<string, unknown> = {}) {
  return {
    userId: "test-user-id",
    available: 100,
    used: 0,
    total: 100,
    ...overrides,
  };
}

// ── AppSettings fixture ─────────────────────────────────────────────

export function createTestAppSettings(overrides: Record<string, unknown> = {}) {
  return {
    id: "default",
    universityName: "Test University",
    universityLogo: null,
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    domain: "localhost",
    studentIdPattern: "^90500\\d{4,}$",
    isSetupComplete: true,
    geminiApiKey: "test-gemini-key",
    geminiModel: "gemini-2.0-flash",
    resendApiKey: "test-resend-key",
    cloudinaryCloudName: "test-cloud",
    cloudinaryApiKey: "test-api-key",
    cloudinaryApiSecret: "test-secret",
    elevenlabsApiKey: null,
    freeQueriesPerDay: 20,
    freeSuspensionHours: 7,
    tokenPackages: JSON.stringify([
      { tokens: 50, price: 5, label: "Starter" },
      { tokens: 200, price: 15, label: "Popular" },
    ]),
    referralBonusTokens: 10,
    termsOfService: "Test TOS",
    privacyPolicy: "Test Privacy Policy",
    codeOfConduct: "Test Code of Conduct",
    contentPolicy: "Test Content Policy",
    ...overrides,
  };
}

// ── AIInteraction fixture ───────────────────────────────────────────

export function createTestAIInteraction(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    userId: "test-user-id",
    conversationId: `conv-${id}`,
    role: "user" as const,
    content: "Test question",
    toolType: null,
    sourceContentIds: [],
    rating: null,
    createdAt: new Date(),
    ...overrides,
  };
}

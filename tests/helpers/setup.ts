import { vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// ── Mock external services ──────────────────────────────────────────

// Prisma — inline mock creation (vi.mock factory is hoisted, can't use external require)
vi.mock("@/lib/prisma", () => {
  const modelMethods = [
    "findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow",
    "findMany", "create", "createMany", "update", "updateMany",
    "upsert", "delete", "deleteMany", "count", "aggregate", "groupBy",
  ];
  const modelNames = [
    "account", "session", "verificationToken", "user", "faculty", "program",
    "content", "contentAccess", "contentRating", "aIInteraction", "message",
    "userBlock", "task", "taskInvitation", "schedule", "tokenBalance",
    "tokenTransaction", "referral", "quizScore", "learningGoal", "forumPost",
    "forumVote", "contentFlag", "userReport", "notification", "lecturerCode",
    "auditLog", "appSettings",
  ];
  const prisma: Record<string, unknown> = {};
  for (const model of modelNames) {
    const mock: Record<string, unknown> = {};
    for (const method of modelMethods) mock[method] = vi.fn();
    prisma[model] = mock;
  }
  prisma.$transaction = vi.fn().mockImplementation(async (fn: unknown) => {
    if (typeof fn === "function") return (fn as (tx: unknown) => unknown)(prisma);
    return Promise.all(fn as Promise<unknown>[]);
  });
  prisma.$queryRaw = vi.fn();
  prisma.$executeRaw = vi.fn();
  prisma.$queryRawUnsafe = vi.fn();
  prisma.$executeRawUnsafe = vi.fn();
  prisma.$connect = vi.fn();
  prisma.$disconnect = vi.fn();
  return { prisma };
});

// Auth — default: authenticated student session
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "test-user-id",
      email: "student@test.com",
      name: "Test Student",
      role: "STUDENT",
      facultyId: "test-faculty-id",
      semester: 1,
      image: null,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  }),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Gemini AI
vi.mock("@/lib/gemini", () => ({
  getGeminiClient: vi.fn().mockResolvedValue({
    generateContent: vi.fn().mockResolvedValue({
      response: { text: () => "Mock AI response" },
    }),
    generateContentStream: vi.fn().mockResolvedValue({
      stream: (async function* () {
        yield { text: () => "Mock " };
        yield { text: () => "streamed " };
        yield { text: () => "response" };
      })(),
    }),
  }),
  fetchSourceContent: vi.fn().mockResolvedValue([]),
  buildSystemPrompt: vi.fn().mockReturnValue("Mock system prompt"),
  buildStudyGuidePrompt: vi.fn().mockReturnValue("Mock study guide prompt"),
  buildMCQPrompt: vi.fn().mockReturnValue("Mock MCQ prompt"),
  buildFillBlanksPrompt: vi.fn().mockReturnValue("Mock fill blanks prompt"),
  buildMatchingPrompt: vi.fn().mockReturnValue("Mock matching prompt"),
  buildTrueFalsePrompt: vi.fn().mockReturnValue("Mock true/false prompt"),
  buildConceptExplainerPrompt: vi.fn().mockReturnValue("Mock concept prompt"),
  buildStudyPlanPrompt: vi.fn().mockReturnValue("Mock study plan prompt"),
  buildExamPrepPrompt: vi.fn().mockReturnValue("Mock exam prep prompt"),
  buildNoteSummaryPrompt: vi.fn().mockReturnValue("Mock note summary prompt"),
  buildAudioScriptPrompt: vi.fn().mockReturnValue("Mock audio script prompt"),
}));

// Cloudinary
vi.mock("@/lib/cloudinary", () => ({
  cloudinary: {
    uploader: {
      upload: vi.fn().mockResolvedValue({
        secure_url: "https://res.cloudinary.com/test/upload.pdf",
        public_id: "test-public-id",
        bytes: 1024,
        format: "pdf",
      }),
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
    config: vi.fn(),
  },
}));

// Resend
vi.mock("@/lib/resend", () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
    },
  },
}));

// ElevenLabs
vi.mock("@/lib/elevenlabs", () => ({
  isElevenLabsConfigured: vi.fn().mockResolvedValue(false),
  generateAudio: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
  ELEVENLABS_VOICES: [],
}));

// Notifications
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue({ id: "mock-notification-id" }),
}));

// Audit
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ id: "mock-audit-id" }),
}));

// bcryptjs — speed up tests
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$mockedhash"),
    compare: vi.fn().mockResolvedValue(true),
    genSalt: vi.fn().mockResolvedValue("$2a$12$mockedsalt"),
  },
  hash: vi.fn().mockResolvedValue("$2a$12$mockedhash"),
  compare: vi.fn().mockResolvedValue(true),
  genSalt: vi.fn().mockResolvedValue("$2a$12$mockedsalt"),
}));

// ── Reset mocks between tests ───────────────────────────────────────

afterEach(() => {
  vi.restoreAllMocks();
});

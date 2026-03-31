# UniNotepad -- Implementation plan

This document is the complete implementation guide for rebuilding LUSL Notepad as UniNotepad. An intermediate engineer with Next.js and Prisma experience should be able to execute this end-to-end.

Read the full PRD at `/prd.md` before starting. This plan references features described there.

---

## Decisions log

These decisions were made before implementation started. Don't revisit them unless something is technically impossible.

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Session strategy | Hybrid (JWT for email/password, DB sessions for OAuth) | NextAuth v5 Credentials provider requires JWT. OAuth providers work with DB sessions, which allow immediate revocation. |
| Subdomain routing | proxy.ts with Vercel Platforms pattern | Next.js 16 replaced middleware.ts with proxy.ts. Same rewrite pattern. *.localhost works natively in browsers for local dev. |
| File storage | Cloudinary (all file types) | PDFs, PPTX, DOCX, and images all upload to Cloudinary. Simplifies storage layer. |
| AI provider | Google Gemini (configurable model) | Admin can switch between Gemini models (Flash, Pro). ElevenLabs kept for premium TTS alongside free Web Speech API. |
| Email | Resend | Modern API, generous free tier, good DX. Used via their SDK, not raw SMTP. |
| Package manager | pnpm | Fast, strict, disk-efficient. |
| Schema | Single-tenant | No University model in Phase 1. Add it when multi-tenant is needed. |
| Deployment | Standalone Docker only | Multi-tenant hosted version is future work. |
| Setup | Basic web wizard | /setup page on first run: create admin, set university name, configure faculties. |
| Testing | Comprehensive | Unit tests for all API routes, integration tests for DB, E2E for all user flows. Target 70%+ coverage. |
| CI/CD | Not in scope | Added separately after the application is stable. |

---

## Tech stack reference

```
Next.js 16+          App Router, proxy.ts, Server Components, Server Actions
PostgreSQL           Primary database
Prisma               ORM, migrations, seed scripts
NextAuth v5          Auth (email/password, Google, Facebook)
shadcn/ui            UI component library (copied into project, not a dependency)
Tailwind CSS v4      CSS-first config with @theme directive
TanStack Query v5    Client-side data fetching and caching
Google Gemini        AI study assistant
ElevenLabs           Premium TTS for audio overview
Web Speech API       Free TTS fallback
Cloudinary           File storage (all file types)
Resend               Transactional email
Monime               Mobile money payments (Sierra Leone)
Docker               Containerized deployment
Vitest               Unit and integration tests
Playwright           E2E tests
```

---

## Folder structure

```
uninotepad/
├── .env.example
├── .env.local                    # Local dev (gitignored)
├── docker-compose.yml
├── Dockerfile
├── package.json
├── pnpm-lock.yaml
├── proxy.ts                      # Subdomain routing (Next.js 16)
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                   # Default data seeding
│   └── migrations/
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (providers, fonts, metadata)
│   │   ├── not-found.tsx
│   │   ├── (public)/             # Root domain: landing, login, register
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── setup/
│   │   │   │   └── page.tsx      # First-run setup wizard
│   │   │   └── layout.tsx        # Public layout (no sidebar)
│   │   ├── (student)/            # Student subdomain pages
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── content/
│   │   │   │   ├── page.tsx      # Browse content
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Single content view
│   │   │   ├── ai/
│   │   │   │   └── page.tsx      # AI study assistant
│   │   │   ├── progress/
│   │   │   │   └── page.tsx
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx
│   │   │   ├── schedule/
│   │   │   │   └── page.tsx
│   │   │   ├── messages/
│   │   │   │   └── page.tsx
│   │   │   ├── forum/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [module]/
│   │   │   │       └── page.tsx
│   │   │   ├── tokens/
│   │   │   │   └── page.tsx
│   │   │   ├── referrals/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx        # Student layout (sidebar + header)
│   │   ├── (lecturer)/           # Lecturer subdomain pages
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── upload/
│   │   │   │   └── page.tsx
│   │   │   ├── content/
│   │   │   │   └── page.tsx      # Manage content
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   ├── messages/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx        # Lecturer layout
│   │   ├── (admin)/              # Admin subdomain pages
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx      # University config
│   │   │   ├── flags/
│   │   │   │   └── page.tsx      # Content moderation queue
│   │   │   ├── reports/
│   │   │   │   └── page.tsx      # User reports queue
│   │   │   ├── codes/
│   │   │   │   └── page.tsx      # Lecturer access codes
│   │   │   ├── messages/
│   │   │   │   └── page.tsx      # Bulk messaging
│   │   │   └── layout.tsx        # Admin layout
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── content/
│   │       ├── ai/
│   │       ├── users/
│   │       ├── messages/
│   │       ├── tasks/
│   │       ├── forum/
│   │       ├── admin/
│   │       ├── tokens/
│   │       ├── referrals/
│   │       ├── notifications/
│   │       └── webhooks/
│   │           ├── monime/
│   │           │   └── route.ts
│   │           └── stripe/
│   │               └── route.ts
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components (generated)
│   │   ├── layouts/
│   │   │   ├── student-sidebar.tsx
│   │   │   ├── lecturer-sidebar.tsx
│   │   │   ├── admin-sidebar.tsx
│   │   │   └── header.tsx
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── role-setup-form.tsx
│   │   ├── content/
│   │   │   ├── content-card.tsx
│   │   │   ├── content-grid.tsx
│   │   │   ├── content-filters.tsx
│   │   │   ├── pdf-viewer.tsx
│   │   │   └── upload-form.tsx
│   │   ├── ai/
│   │   │   ├── chat-interface.tsx
│   │   │   ├── chat-message.tsx
│   │   │   ├── source-drawer.tsx
│   │   │   ├── learning-studio.tsx
│   │   │   ├── audio-player.tsx
│   │   │   └── chat-history.tsx
│   │   ├── dashboard/
│   │   │   ├── task-manager.tsx
│   │   │   ├── schedule-manager.tsx
│   │   │   ├── stats-cards.tsx
│   │   │   └── quick-actions.tsx
│   │   ├── forum/
│   │   │   ├── post-list.tsx
│   │   │   ├── post-form.tsx
│   │   │   └── reply-thread.tsx
│   │   ├── messages/
│   │   │   ├── inbox.tsx
│   │   │   ├── compose.tsx
│   │   │   └── message-thread.tsx
│   │   ├── admin/
│   │   │   ├── user-table.tsx
│   │   │   ├── flag-queue.tsx
│   │   │   ├── report-queue.tsx
│   │   │   └── university-settings.tsx
│   │   └── shared/
│   │       ├── data-export-button.tsx
│   │       ├── notification-bell.tsx
│   │       ├── global-search.tsx
│   │       ├── theme-toggle.tsx
│   │       └── file-upload.tsx
│   ├── lib/
│   │   ├── auth.ts               # NextAuth config (full, with Prisma adapter)
│   │   ├── auth.config.ts        # NextAuth config (edge-safe, no adapter)
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── cloudinary.ts         # Cloudinary upload/delete helpers
│   │   ├── resend.ts             # Email client and templates
│   │   ├── gemini.ts             # Gemini AI client and prompt builders
│   │   ├── elevenlabs.ts         # ElevenLabs TTS client
│   │   ├── payments/
│   │   │   ├── monime.ts         # Monime payment adapter
│   │   │   └── stripe.ts         # Stripe payment adapter
│   │   ├── validators/
│   │   │   ├── auth.ts           # Zod schemas for auth inputs
│   │   │   ├── content.ts        # Zod schemas for content inputs
│   │   │   ├── ai.ts             # Zod schemas for AI inputs
│   │   │   └── admin.ts          # Zod schemas for admin inputs
│   │   ├── utils.ts              # cn() helper, date formatting, etc.
│   │   ├── constants.ts          # App-wide constants
│   │   └── types.ts              # Shared TypeScript types
│   ├── hooks/
│   │   ├── use-session.ts        # Typed session hook
│   │   ├── use-notifications.ts
│   │   └── use-debounce.ts
│   └── styles/
│       └── globals.css           # Tailwind v4 entry + @theme config
├── tests/
│   ├── unit/
│   │   ├── api/                  # API route unit tests
│   │   ├── lib/                  # Utility function tests
│   │   └── validators/           # Zod schema tests
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── content.test.ts
│   │   ├── ai.test.ts
│   │   └── admin.test.ts
│   ├── e2e/
│   │   ├── registration.spec.ts
│   │   ├── student-flow.spec.ts
│   │   ├── lecturer-flow.spec.ts
│   │   ├── admin-flow.spec.ts
│   │   └── ai-chat.spec.ts
│   └── helpers/
│       ├── db.ts                 # Test database setup/teardown
│       └── fixtures.ts           # Test data factories
├── docs/
│   ├── self-hosting.md
│   ├── configuration.md
│   ├── api-reference.md
│   └── contributing.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE                       # MIT
└── README.md
```

---

## Phase 1: Foundation

Everything else depends on this phase. Don't skip steps.

### 1.1 Project scaffolding

- [x] Create Next.js 16 project: `pnpm create next-app@latest uninotepad --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- [x] Verify Node.js version is 20.9+ (`node -v`) -- v25.8.1
- [x] Verify Next.js version is 16+ in `package.json` -- 16.2.1
- [x] Initialize shadcn/ui: `pnpm dlx shadcn@latest init`
  - Style: New York
  - Base color: Neutral
  - CSS variables: yes
- [x] Add core shadcn components: `pnpm dlx shadcn@latest add -a` (55 components installed)
- [x] Configure Tailwind v4 in `src/styles/globals.css`:
  ```css
  @import "tailwindcss";

  @theme {
    --color-background: oklch(0.145 0 0);
    --color-foreground: oklch(0.985 0 0);
    --color-primary: oklch(0.541 0.281 293.009);
    --color-primary-foreground: oklch(0.985 0 0);
    /* ... full shadcn theme tokens for dark/light */
  }
  ```
- [x] Install `next-themes` for dark/light toggle: `pnpm add next-themes`
- [x] Create theme provider component at `src/components/shared/theme-toggle.tsx`
- [x] Set up root layout with providers (ThemeProvider, SessionProvider, QueryClientProvider)
- [x] Verify dev server starts: `pnpm dev`, visit `http://localhost:3000`

### 1.2 Database and Prisma

- [x] Install Prisma: `pnpm add prisma@6 @prisma/client@6` (using Prisma 6, not 7 -- Prisma 7 has breaking changes to datasource config)
- [x] Initialize Prisma: `pnpm dlx prisma init`
- [x] Set `DATABASE_URL` in `.env.local` pointing to a local PostgreSQL instance
- [x] Write the full Prisma schema (see schema section below) -- 28 models, 11 enums
- [x] Run first migration: `npx prisma migrate dev --name init` (migration: 20260327165450_init)
- [x] Create Prisma client singleton at `src/lib/prisma.ts`:
  ```ts
  import { PrismaClient } from '@prisma/client'

  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

  export const prisma = globalForPrisma.prisma || new PrismaClient()

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  ```
- [x] Verify connection: `pnpm dlx prisma studio` (opens DB browser) -- all 28 tables confirmed via psql

#### Prisma schema

Write this in `prisma/schema.prisma`. Every field is listed. Don't improvise.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── NextAuth required models ───

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Application models ───

enum UserRole {
  STUDENT
  LECTURER
  ADMIN
}

enum ContentStatus {
  ACTIVE
  DRAFT
  ARCHIVED
}

enum ContentType {
  LECTURE_NOTES
  ASSIGNMENT
  TIMETABLE
  TUTORIAL
  PROJECT
  LAB
  OTHER
}

enum Priority {
  HIGH
  MEDIUM
  LOW
}

enum TaskStatus {
  PENDING
  COMPLETED
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  PAUSED
}

enum FlagStatus {
  PENDING
  REVIEWED
  RESOLVED
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
}

enum TransactionType {
  PURCHASE
  USAGE
  BONUS
  REFUND
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
}

enum NotificationType {
  NEW_CONTENT
  MESSAGE_RECEIVED
  TASK_DEADLINE
  REFERRAL_BONUS
  CONTENT_FLAGGED
  REPORT_RESOLVED
  SYSTEM
}

model User {
  id                     String    @id @default(cuid())
  name                   String?
  email                  String?   @unique
  emailVerified          DateTime?
  image                  String?
  password               String?   // bcrypt hash, null for OAuth users
  role                   UserRole  @default(STUDENT)
  facultyId              String?
  semester               Int?
  programId              String?
  studentId              String?   @unique
  avatarUrl              String?
  termsAccepted          Boolean   @default(false)
  privacyAccepted        Boolean   @default(false)
  referralCode           String?   @unique
  freeQueriesRemaining   Int       @default(20)
  freeQueriesResetAt     DateTime?
  isActive               Boolean   @default(true)
  isSuspended            Boolean   @default(false)
  suspendedReason        String?
  dateOfBirth            DateTime?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
  deletedAt              DateTime?

  // NextAuth relations
  accounts               Account[]
  sessions               Session[]

  // Application relations
  faculty                Faculty?          @relation(fields: [facultyId], references: [id])
  program                Program?          @relation(fields: [programId], references: [id])
  content                Content[]         @relation("ContentAuthor")
  contentAccess          ContentAccess[]
  contentRatings         ContentRating[]
  aiInteractions         AIInteraction[]
  sentMessages           Message[]         @relation("MessageSender")
  receivedMessages       Message[]         @relation("MessageRecipient")
  blockedUsers           UserBlock[]       @relation("Blocker")
  blockedBy              UserBlock[]       @relation("Blocked")
  tasks                  Task[]
  taskInvitationsSent    TaskInvitation[]  @relation("Inviter")
  scheduleEntries        Schedule[]
  tokenBalance           TokenBalance?
  tokenTransactions      TokenTransaction[]
  referralsMade          Referral[]        @relation("Referrer")
  referralsReceived      Referral[]        @relation("Referee")
  quizScores             QuizScore[]
  learningGoals          LearningGoal[]
  forumPosts             ForumPost[]
  forumVotes             ForumVote[]
  contentFlags           ContentFlag[]     @relation("FlagReporter")
  contentFlagsReviewed   ContentFlag[]     @relation("FlagReviewer")
  userReportsFiled       UserReport[]      @relation("Reporter")
  userReportsReceived    UserReport[]      @relation("Reported")
  userReportsReviewed    UserReport[]      @relation("ReportReviewer")
  notifications          Notification[]
  auditLogs              AuditLog[]

  @@index([email])
  @@index([role])
  @@index([facultyId, semester])
}

model Faculty {
  id        String   @id @default(cuid())
  name      String
  code      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  programs  Program[]
  users     User[]
  content   Content[]
  forumPosts ForumPost[]
}

model Program {
  id        String   @id @default(cuid())
  facultyId String
  name      String
  code      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  faculty   Faculty  @relation(fields: [facultyId], references: [id], onDelete: Cascade)
  users     User[]
  content   Content[]

  @@unique([facultyId, code])
}

model Content {
  id            String        @id @default(cuid())
  title         String
  description   String?
  fileUrl       String
  filePublicId  String?       // Cloudinary public_id for deletion
  fileType      String        // pdf, pptx, docx, jpeg, png
  fileSize      Int           // bytes
  facultyId     String
  semester      Int
  programId     String?
  module        String
  moduleCode    String?
  contentType   ContentType
  lecturerId    String
  viewCount     Int           @default(0)
  downloadCount Int           @default(0)
  averageRating Float?
  status        ContentStatus @default(ACTIVE)
  version       Int           @default(1)
  tutorialLink  String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  faculty       Faculty       @relation(fields: [facultyId], references: [id])
  program       Program?      @relation(fields: [programId], references: [id])
  lecturer      User          @relation("ContentAuthor", fields: [lecturerId], references: [id])
  access        ContentAccess[]
  ratings       ContentRating[]
  flags         ContentFlag[]

  @@index([facultyId, semester])
  @@index([lecturerId])
  @@index([status])
}

model ContentAccess {
  id         String   @id @default(cuid())
  contentId  String
  userId     String
  accessType String   // "view" or "download"
  createdAt  DateTime @default(now())

  content    Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([contentId])
  @@index([userId])
}

model ContentRating {
  id           String   @id @default(cuid())
  contentId    String
  userId       String
  rating       Int      // 1-5
  feedbackText String?
  createdAt    DateTime @default(now())

  content      Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([contentId, userId])
}

model AIInteraction {
  id               String   @id @default(cuid())
  userId           String
  conversationId   String   // groups messages in a conversation
  query            String   @db.Text
  response         String   @db.Text
  sourceContentIds String[] // array of Content IDs used as context
  queryType        String   // "chat", "study_guide", "quiz", etc.
  learningLevel    String?  // "beginner", "intermediate", "advanced"
  satisfactionRating Int?   // 1-5
  responseTimeMs   Int?
  tokensUsed       Int      @default(1)
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([conversationId])
}

model Message {
  id          String   @id @default(cuid())
  senderId    String
  recipientId String
  subject     String
  body        String   @db.Text
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())

  sender      User     @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)
  recipient   User     @relation("MessageRecipient", fields: [recipientId], references: [id], onDelete: Cascade)

  @@index([recipientId, isRead])
  @@index([senderId])
}

model UserBlock {
  id        String   @id @default(cuid())
  blockerId String
  blockedId String
  createdAt DateTime @default(now())

  blocker   User     @relation("Blocker", fields: [blockerId], references: [id], onDelete: Cascade)
  blocked   User     @relation("Blocked", fields: [blockedId], references: [id], onDelete: Cascade)

  @@unique([blockerId, blockedId])
}

model Task {
  id          String     @id @default(cuid())
  userId      String
  title       String
  description String?
  deadline    DateTime?
  priority    Priority   @default(MEDIUM)
  status      TaskStatus @default(PENDING)
  tags        String[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  invitations TaskInvitation[]

  @@index([userId, status])
}

model TaskInvitation {
  id           String   @id @default(cuid())
  taskId       String
  inviterId    String
  inviteeEmail String
  status       String   @default("pending") // pending, accepted, declined
  createdAt    DateTime @default(now())

  task         Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  inviter      User     @relation("Inviter", fields: [inviterId], references: [id], onDelete: Cascade)

  @@unique([taskId, inviteeEmail])
}

model Schedule {
  id        String   @id @default(cuid())
  userId    String
  dayOfWeek Int      // 0=Sunday, 6=Saturday
  startTime String   // "08:00"
  endTime   String   // "10:00"
  subject   String
  location  String?
  type      String?  // "lecture", "tutorial", "lab"
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model TokenBalance {
  id        String   @id @default(cuid())
  userId    String   @unique
  available Int      @default(0)
  used      Int      @default(0)
  total     Int      @default(0)
  bonus     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model TokenTransaction {
  id               String            @id @default(cuid())
  userId           String
  amount           Int
  type             TransactionType
  paymentProvider  String?           // "monime", "stripe"
  paymentReference String?
  status           TransactionStatus @default(PENDING)
  metadata         Json?
  createdAt        DateTime          @default(now())

  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([paymentReference])
}

model Referral {
  id            String   @id @default(cuid())
  referrerId    String
  refereeId     String
  tokensAwarded Int      @default(0)
  status        String   @default("pending") // pending, completed
  createdAt     DateTime @default(now())

  referrer      User     @relation("Referrer", fields: [referrerId], references: [id], onDelete: Cascade)
  referee       User     @relation("Referee", fields: [refereeId], references: [id], onDelete: Cascade)

  @@unique([referrerId, refereeId])
}

model QuizScore {
  id             String   @id @default(cuid())
  userId         String
  module         String
  quizType       String   // "mcq", "true_false", "fill_blanks", "matching"
  score          Int
  totalQuestions Int
  createdAt      DateTime @default(now())

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model LearningGoal {
  id              String     @id @default(cuid())
  userId          String
  title           String
  description     String?
  targetDate      DateTime?
  status          GoalStatus @default(ACTIVE)
  progressPercent Int        @default(0)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model ForumPost {
  id               String      @id @default(cuid())
  module           String
  facultyId        String
  authorId         String
  title            String?     // null for replies
  body             String      @db.Text
  isPinned         Boolean     @default(false)
  parentId         String?     // null = top-level post, else reply
  upvoteCount      Int         @default(0)
  isAcceptedAnswer Boolean     @default(false)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  faculty          Faculty     @relation(fields: [facultyId], references: [id])
  author           User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent           ForumPost?  @relation("PostReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies          ForumPost[] @relation("PostReplies")
  votes            ForumVote[]

  @@index([module, facultyId])
  @@index([parentId])
}

model ForumVote {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post      ForumPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
}

model ContentFlag {
  id          String     @id @default(cuid())
  contentId   String
  reporterId  String
  reason      String
  status      FlagStatus @default(PENDING)
  adminNotes  String?
  reviewedBy  String?
  createdAt   DateTime   @default(now())
  resolvedAt  DateTime?

  content     Content    @relation(fields: [contentId], references: [id], onDelete: Cascade)
  reporter    User       @relation("FlagReporter", fields: [reporterId], references: [id], onDelete: Cascade)
  reviewer    User?      @relation("FlagReviewer", fields: [reviewedBy], references: [id])

  @@index([status])
}

model UserReport {
  id             String       @id @default(cuid())
  reportedUserId String
  reporterId     String
  reason         String
  context        String?      // message_id or post_id for reference
  status         ReportStatus @default(PENDING)
  adminNotes     String?
  actionTaken    String?
  reviewedBy     String?
  createdAt      DateTime     @default(now())
  resolvedAt     DateTime?

  reportedUser   User         @relation("Reported", fields: [reportedUserId], references: [id], onDelete: Cascade)
  reporter       User         @relation("Reporter", fields: [reporterId], references: [id], onDelete: Cascade)
  reviewer       User?        @relation("ReportReviewer", fields: [reviewedBy], references: [id])

  @@index([status])
}

model Notification {
  id            String           @id @default(cuid())
  userId        String
  type          NotificationType
  title         String
  body          String
  isRead        Boolean          @default(false)
  referenceType String?          // "content", "message", "task", etc.
  referenceId   String?
  createdAt     DateTime         @default(now())

  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
}

model LecturerCode {
  id           String    @id @default(cuid())
  code         String    @unique // stored as bcrypt hash
  facultyId    String?
  lecturerName String
  isActive     Boolean   @default(true)
  createdBy    String    // admin user ID
  createdAt    DateTime  @default(now())
  revokedAt    DateTime?
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String   // "user.role_changed", "content.removed", "user.suspended", etc.
  entityType String   // "user", "content", "flag", "report"
  entityId   String
  metadata   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}

model AppSettings {
  id                  String   @id @default("default")
  universityName      String   @default("University")
  universityLogo      String?
  primaryColor        String   @default("#7c3aed")
  secondaryColor      String   @default("#1e1e1e")
  domain              String?
  studentIdPattern    String   @default("^90500\\d{4,}$")
  maxSemesters        Int      @default(8)
  termsOfService      String?  @db.Text
  privacyPolicy       String?  @db.Text
  codeOfConduct       String?  @db.Text
  contentPolicy       String?  @db.Text
  geminiModel         String   @default("gemini-2.0-flash")
  geminiApiKey        String?
  elevenlabsApiKey    String?
  resendApiKey        String?
  monimeApiKey        String?
  stripeSecretKey     String?
  cloudinaryCloudName String?
  cloudinaryApiKey    String?
  cloudinaryApiSecret String?
  freeQueriesPerDay   Int      @default(20)
  freeSuspensionHours Int      @default(7)
  referralBonusTokens Int      @default(5)
  tokenPackages       Json?    // [{amount: 10, priceSLE: 50, priceUSD: 2}, ...]
  isSetupComplete     Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### 1.3 Authentication (NextAuth v5)

- [x] Install NextAuth: `pnpm add next-auth@beta @auth/prisma-adapter` -- next-auth@5.0.0-beta.30
- [x] Install bcrypt: `pnpm add bcryptjs` and `pnpm add -D @types/bcryptjs` -- bcryptjs 3.x includes own types
- [x] Create `src/lib/auth.config.ts` (edge-safe config, no Prisma):
  ```ts
  import type { NextAuthConfig } from 'next-auth'

  export const authConfig: NextAuthConfig = {
    pages: {
      signIn: '/login',
      newUser: '/register',
    },
    callbacks: {
      authorized({ auth, request: { nextUrl } }) {
        const isLoggedIn = !!auth?.user
        const isPublicPage = ['/', '/login', '/register', '/setup'].includes(nextUrl.pathname)
        if (isPublicPage) return true
        if (!isLoggedIn) return false
        return true
      },
      async jwt({ token, user }) {
        if (user) {
          token.role = user.role
          token.facultyId = user.facultyId
          token.semester = user.semester
          token.programId = user.programId
          token.studentId = user.studentId
        }
        return token
      },
      async session({ session, token, user }) {
        // For JWT strategy (credentials)
        if (token) {
          session.user.id = token.sub!
          session.user.role = token.role as string
          session.user.facultyId = token.facultyId as string
          session.user.semester = token.semester as number
          session.user.programId = token.programId as string
          session.user.studentId = token.studentId as string
        }
        // For DB strategy (OAuth)
        if (user) {
          session.user.role = user.role
          session.user.facultyId = user.facultyId
          session.user.semester = user.semester
          session.user.programId = user.programId
          session.user.studentId = user.studentId
        }
        return session
      },
    },
    providers: [], // filled in auth.ts
  }
  ```
- [x] Create `src/lib/auth.ts` (full config with Prisma adapter and all providers):
  ```ts
  import NextAuth from 'next-auth'
  import Google from 'next-auth/providers/google'
  import Facebook from 'next-auth/providers/facebook'
  import Credentials from 'next-auth/providers/credentials'
  import { PrismaAdapter } from '@auth/prisma-adapter'
  import bcrypt from 'bcryptjs'
  import { prisma } from './prisma'
  import { authConfig } from './auth.config'

  export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: {
      strategy: 'database', // default for OAuth
    },
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }),
      Facebook({
        clientId: process.env.AUTH_FACEBOOK_ID,
        clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      }),
      Credentials({
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })
          if (!user || !user.password) return null
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )
          if (!isValid) return null
          return user
        },
      }),
    ],
  })
  ```
  **Note on hybrid sessions:** NextAuth v5 uses the adapter's DB session strategy by default when an adapter is present. The Credentials provider will automatically fall back to JWT because it can't create DB sessions. This hybrid behavior is built-in -- you don't need extra config.
- [x] Create API route at `src/app/api/auth/[...nextauth]/route.ts`:
  ```ts
  import { handlers } from '@/lib/auth'
  export const { GET, POST } = handlers
  ```
- [x] Create custom registration API at `src/app/api/auth/register/route.ts` that:
  - Validates input with Zod
  - Hashes password with bcrypt (cost 12)
  - Creates User record
  - Creates TokenBalance record (default 0)
  - Generates unique referral code
  - [ ] Sends verification email via Resend (deferred to Phase 2 -- email templates not yet built)
- [x] Extend NextAuth TypeScript types in `src/types/next-auth.d.ts`:
  ```ts
  import { UserRole } from '@prisma/client'
  declare module 'next-auth' {
    interface User {
      role: UserRole
      facultyId: string | null
      semester: number | null
      programId: string | null
      studentId: string | null
    }
    interface Session {
      user: User & { id: string }
    }
  }
  ```
- [x] Test: register with email/password, login, check session has role -- verified via curl, user + TokenBalance created in DB
- [ ] Test: register with Google OAuth, check session (requires AUTH_GOOGLE_ID/SECRET env vars)
- [ ] Test: register with Facebook OAuth, check session (requires AUTH_FACEBOOK_ID/SECRET env vars)

### 1.4 Subdomain routing (proxy.ts)

- [x] Create `proxy.ts` at project root (NOT in src/) -- note: removed unused `import { auth }` from implementation example:
  ```ts
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'
  import { auth } from '@/lib/auth'

  function extractSubdomain(hostname: string): string | null {
    // Local dev: admin.localhost:3000 -> "admin"
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      const parts = hostname.split('.localhost')[0].split('.')
      if (parts.length > 0 && parts[0] !== 'localhost' && parts[0] !== '127') {
        return parts[0]
      }
      return null
    }

    // Production: admin.lunsl.org -> "admin"
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
    const rootParts = rootDomain.split('.').length
    const hostParts = hostname.split('.')
    if (hostParts.length > rootParts) {
      return hostParts[0]
    }
    return null
  }

  export function proxy(request: NextRequest) {
    const hostname = request.headers.get('host') || ''
    const url = request.nextUrl.clone()
    const subdomain = extractSubdomain(hostname)

    // No subdomain = root domain (public pages, student pages after login)
    if (!subdomain) {
      return NextResponse.next()
    }

    // Rewrite subdomain requests to internal route groups
    if (subdomain === 'admin') {
      url.pathname = `/_admin${url.pathname}`
      return NextResponse.rewrite(url)
    }

    if (subdomain === 'lecturer') {
      url.pathname = `/_lecturer${url.pathname}`
      return NextResponse.rewrite(url)
    }

    // Unknown subdomain -> 404
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }

  export const config = {
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).+)',
    ],
  }
  ```
- [x] Rename folder structure to match rewrites:
  - `src/app/(admin)/` becomes `src/app/_admin/` (rewrite target)
  - `src/app/(lecturer)/` becomes `src/app/_lecturer/` (rewrite target)
  - `src/app/(student)/` stays at root path under `src/app/(student)/`
  - `src/app/(public)/` stays at root for landing, login, register
- [x] Add `NEXT_PUBLIC_ROOT_DOMAIN` to `.env.example`:
  ```
  NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
  ```
- [x] Test locally:
  - `http://localhost:3000` -> landing page (HTTP 200, renders "Landing")
  - `http://admin.localhost:3000` -> admin dashboard (HTTP 307 redirect to /login when unauthenticated)
  - `http://lecturer.localhost:3000` -> lecturer dashboard (HTTP 307 redirect to /login when unauthenticated)
  - `http://localhost:3000/dashboard` -> student dashboard (HTTP 307 redirect to /login when unauthenticated)
- [x] Add role guard in each layout:
  - `_admin/layout.tsx` checks `session.user.role === 'ADMIN'`, redirects to root if not
  - `_lecturer/layout.tsx` checks `session.user.role === 'LECTURER'`
  - `(student)/layout.tsx` checks `session.user.role === 'STUDENT'`

### 1.5 Environment variables

- [x] Create `.env.example` with all required/optional vars:
  ```
  # Database
  DATABASE_URL="postgresql://user:pass@localhost:5432/uninotepad"

  # NextAuth
  AUTH_SECRET="generate-with-npx-auth-secret"
  AUTH_GOOGLE_ID=""
  AUTH_GOOGLE_SECRET=""
  AUTH_FACEBOOK_ID=""
  AUTH_FACEBOOK_SECRET=""
  NEXTAUTH_URL="http://localhost:3000"

  # Domain
  NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000"

  # AI
  GEMINI_API_KEY=""

  # File storage
  CLOUDINARY_CLOUD_NAME=""
  CLOUDINARY_API_KEY=""
  CLOUDINARY_API_SECRET=""

  # Email
  RESEND_API_KEY=""

  # TTS (optional)
  ELEVENLABS_API_KEY=""

  # Payments (optional)
  MONIME_API_KEY=""
  STRIPE_SECRET_KEY=""
  STRIPE_WEBHOOK_SECRET=""
  ```
- [x] Create `.env.local` from `.env.example` with real values for local dev
- [x] Verify `.env.local` is in `.gitignore` -- `.env*` pattern covers it

### 1.6 Core utilities

- [x] Install Zod: `pnpm add zod` -- zod@4.3.6 (import from `zod/v4`)
- [x] Install TanStack Query: `pnpm add @tanstack/react-query` -- v5.95.2
- [x] Install Cloudinary SDK: `pnpm add cloudinary`
- [x] Install Resend: `pnpm add resend`
- [x] Install Gemini SDK: `pnpm add @google/generative-ai`
- [x] Create `src/lib/cloudinary.ts` -- cloudinary v2 config initialized
- [x] Create `src/lib/resend.ts` -- Resend client initialized
- [x] Create `src/lib/gemini.ts` -- GoogleGenerativeAI client with getModel() helper
- [x] Create `src/lib/validators/auth.ts` -- Zod schemas: loginSchema, registerSchema, roleSetupSchema
- [x] Create `src/lib/validators/content.ts` -- Zod schemas: contentUploadSchema, contentUpdateSchema, contentRatingSchema
- [x] Create `src/lib/validators/ai.ts` -- Zod schemas: aiQuerySchema, learningToolSchema
- [x] Create `src/lib/validators/admin.ts` -- Zod schemas: userUpdateSchema, settingsSchema, lecturerCodeSchema
- [x] Create `src/lib/utils.ts` -- cn() helper (already from shadcn init), date formatters, file size formatter, referral code generator
- [x] Create `src/lib/constants.ts` -- content types enum labels, priority labels, notification type labels, BCRYPT_ROUNDS
- [x] Create TanStack Query provider wrapper at `src/components/providers.tsx` -- includes ThemeProvider, SessionProvider, QueryClientProvider, TooltipProvider
- [x] Add providers to root layout

### Phase 1 verification

- [x] `pnpm dev` starts without errors -- Next.js 16.2.1 (Turbopack), ready in ~270ms
- [x] `http://localhost:3000` shows a page -- HTTP 200, renders "Landing" placeholder
- [x] `http://admin.localhost:3000` shows a different page -- rewrites to /_admin/ via proxy.ts
- [x] `http://lecturer.localhost:3000` shows a different page -- rewrites to /_lecturer/ via proxy.ts
- [x] Prisma Studio shows all tables -- 28 tables confirmed via psql (28 models + _prisma_migrations)
- [x] Registration creates a user in the database -- POST /api/auth/register creates User + TokenBalance + referralCode
- [ ] Login returns a session with role, faculty, semester (requires UI login form -- NextAuth providers endpoint returns HTTP 200)
- [ ] OAuth login (Google) works (requires AUTH_GOOGLE_ID/SECRET env vars)
- [x] Protected routes redirect unauthenticated users to /login -- all 3 role layouts return HTTP 307 -> /login
- [x] Admin routes reject non-admin users -- _admin/layout.tsx checks role === 'ADMIN', redirects otherwise

---

## Phase 2: Student experience

Build the student-facing features. This is the largest phase.

### 2.1 Landing page and public pages

- [x] Build landing page at `src/app/(public)/page.tsx`:
  - University name and logo (from AppSettings, fetched server-side)
  - Hero section explaining the platform
  - Feature highlights (course materials, AI assistant, progress tracking)
  - Call-to-action: Register / Login buttons
  - Footer with links to terms of service, privacy policy, code of conduct
- [x] Build login page at `src/app/(public)/login/page.tsx`:
  - Email/password form
  - Google sign-in button
  - Facebook sign-in button
  - "Forgot password" link
  - "Don't have an account? Register" link
- [x] Build register page at `src/app/(public)/register/page.tsx`:
  - Step 1: Choose auth method (email/password, Google, Facebook)
  - Step 2: Role selection (Student, Lecturer, Admin)
  - Step 3: Role-specific fields
    - Student: Student ID input (validated against AppSettings.studentIdPattern), auto-filled faculty/semester/program
    - Lecturer: Access code input (validated against LecturerCode table)
    - Admin: Access code input (validated against hardcoded admin setup code, only during first setup)
  - Step 4: Accept Terms of Service AND Privacy Policy (separate checkboxes)
  - Redirect to role-specific subdomain on completion
- [x] Build email verification page at `src/app/(public)/verify/page.tsx`
- [x] Build forgot password page and reset flow

### 2.2 Student layout

- [x] Create student sidebar at `src/components/layouts/student-sidebar.tsx`:
  - Navigation items: Dashboard, Course Materials, AI Assistant, Tasks, Schedule, Messages, Forum, Progress, Tokens, Referrals, Settings
  - Collapsible on mobile (sheet drawer)
  - Active page highlight
  - User avatar and name at bottom
  - Notification bell with unread count in header
- [x] Create student layout at `src/app/(student)/layout.tsx`:
  - Auth guard: redirect to /login if no session, redirect to /register if session but no role setup
  - Sidebar + main content area
  - Global search in header
  - Mobile-responsive: sidebar becomes a hamburger menu

### 2.3 Student dashboard

- [x] Build dashboard at `src/app/(student)/dashboard/page.tsx`:
  - Time-based greeting ("Good morning, Ibrahim")
  - Academic info display (Faculty, Semester, Program)
  - Stats cards: unread messages count, upcoming deadlines count, AI queries remaining, recent quiz average
  - Quick action buttons: Browse Materials, Start AI Chat, View Schedule

### 2.4 Task manager

- [x] Build tasks page at `src/app/(student)/tasks/page.tsx`
- [x] API routes:
  - [x] `GET /api/tasks` -- list tasks for current user, optional filters (status, priority)
  - [x] `POST /api/tasks` -- create task with Zod validation
  - [x] `PATCH /api/tasks/[id]` -- update task (title, description, deadline, priority, status)
  - [x] `DELETE /api/tasks/[id]` -- delete task (verify ownership)
  - [x] `POST /api/tasks/[id]/invite` -- create TaskInvitation, send email notification
- [x] Task UI:
  - [x] Task list with status/priority filters
  - [x] Add task dialog: title, description, deadline (date picker), priority (select), tags (multi-input)
  - [x] Inline edit and delete
  - [x] Countdown timers on tasks due within 24 hours
  - [x] Collaboration: "Invite" button opens email input, sends invitation
  - [ ] Toast notification when a task deadline is approaching (check on page load)

### 2.5 Schedule manager

- [x] Build schedule page at `src/app/(student)/schedule/page.tsx`
- [x] API routes:
  - [x] `GET /api/schedule` -- list schedule entries for current user
  - [x] `POST /api/schedule` -- create entry
  - [x] `PATCH /api/schedule/[id]` -- update entry
  - [x] `DELETE /api/schedule/[id]` -- delete entry
- [x] Schedule UI:
  - [x] Weekly grid view (7 columns, time rows)
  - [x] Add entry dialog: day (select), start time, end time, subject, location, type
  - [x] Color-coded by type (lecture, tutorial, lab)
  - [ ] Mini calendar showing current month with today highlighted
  - [ ] Timetable content uploaded by lecturers also displayed here (read from Content where type = TIMETABLE and matching faculty/semester)

### 2.6 Course materials

- [x] Build content browse page at `src/app/(student)/content/page.tsx`
- [x] Build content detail page at `src/app/(student)/content/[id]/page.tsx`
- [x] API routes:
  - [x] `GET /api/content` -- list content filtered by user's faculty + semester (enforced server-side). Query params: search, module, lecturerId, contentType, sort (newest/views/downloads), page
  - [x] `GET /api/content/[id]` -- single item (verify faculty/semester match)
  - [x] `POST /api/content/[id]/access` -- log view or download, increment counters
  - [x] `POST /api/content/[id]/rate` -- create/update rating (1-5, optional feedback)
  - [x] `POST /api/content/[id]/flag` -- flag content with reason
- [x] Content browse UI:
  - [x] Search bar (title, module name)
  - [x] Filter dropdowns: module, lecturer, content type
  - [x] Sort dropdown: newest, most viewed, most downloaded
  - [x] Content cards: title, module, lecturer name, file type badge (color-coded), semester, view count, download count, average rating
  - [x] Pagination: "Load more" button, 30 items per page
- [x] Content detail/viewer:
  - [x] PDF: embed pdf.js viewer with annotation support. Install: `pnpm add pdfjs-dist`
  - [x] PPTX: Google Slides viewer iframe (URL: `https://docs.google.com/gview?url=ENCODED_URL&embedded=true`)
  - [x] DOCX: download button (no inline preview)
  - [x] Images: native img tag with zoom
  - [x] Download button for all types
  - [x] Rating widget (1-5 stars + optional text feedback)
  - [x] Flag button ("Report this content")
  - [x] Tutorial link button (if present)

### 2.7 Messaging

- [x] Build messages page at `src/app/(student)/messages/page.tsx`
- [x] API routes:
  - [x] `GET /api/messages` -- inbox (received messages, paginated, with sender info)
  - [x] `GET /api/messages/sent` -- sent messages
  - [x] `POST /api/messages` -- send message (check: recipient not blocked, sender not blocked by recipient)
  - [x] `PATCH /api/messages/[id]/read` -- mark as read (verify recipient is current user)
  - [x] `POST /api/messages/[id]/report` -- report message
  - [x] `POST /api/users/[id]/block` -- block user
  - [x] `DELETE /api/users/[id]/block` -- unblock user
- [x] Messages UI:
  - [x] Tab view: Inbox / Sent
  - [x] Compose dialog: recipient autocomplete (search users by name), subject, body
  - [x] Unread indicators (bold text, blue dot)
  - [x] Reply button on received messages
  - [x] Block user option in message actions
  - [x] Report message option in message actions
  - [ ] Email notification sent via Resend when a message is received (if user has notifications enabled)

### 2.8 Notifications

- [x] Create notification bell component at `src/components/shared/notification-bell.tsx`
- [x] API routes:
  - [x] `GET /api/notifications` -- list notifications for current user, paginated, newest first
  - [x] `PATCH /api/notifications/[id]/read` -- mark as read
  - [x] `PATCH /api/notifications/read-all` -- mark all as read
- [x] Notification creation: create a utility function `createNotification(userId, type, title, body, referenceType?, referenceId?)` used across all API routes that trigger notifications
- [x] Notification dropdown:
  - [x] Bell icon with unread count badge
  - [x] Dropdown shows recent notifications
  - [x] Click notification marks it as read and navigates to the relevant page
  - [x] "Mark all as read" link

### 2.9 Global search

- [x] Create search component at `src/components/shared/global-search.tsx`
- [x] API route: `GET /api/search?q=QUERY` -- searches across:
  - Content (title, module) -- filtered by faculty/semester
  - Tasks (title)
  - Schedule (subject)
  - Messages (subject, body)
  - Forum posts (title, body) -- filtered by faculty
- [x] Use shadcn Command component (Cmd+K / Ctrl+K to open)
- [x] Results grouped by category with icons
- [x] Click result navigates to the relevant page

### Phase 2 verification

- [x] Landing page renders with university branding from AppSettings
- [x] Registration flow works for all three roles
- [x] Student can only see content from their faculty + semester
- [x] Task CRUD works, invitations send emails
- [x] Schedule entries display in weekly grid
- [x] Content browse filters and sorts work
- [x] PDF viewer opens with annotations
- [x] Messaging works, blocking prevents messages, reporting creates entries
- [x] Notifications appear when relevant events happen
- [x] Global search returns results from all categories

---

## Phase 3: AI study assistant

The most complex feature. Build it after Phase 2 so you have content in the database to test with.

### 3.1 Core AI chat

- [x] Build AI page at `src/app/(student)/ai/page.tsx`
- [x] Create Gemini client at `src/lib/gemini.ts` (async from AppSettings with env fallback, 60s TTL cache)
- [x] API routes:
  - [x] `POST /api/ai/query` -- main chat endpoint (streaming SSE, rate limit, source context, conversation history)
  - [x] `GET /api/ai/history` -- list conversations (grouped by conversationId, most recent first)
  - [x] `DELETE /api/ai/history/[id]` -- delete conversation by conversationId
  - [x] `DELETE /api/ai/history` -- clear all history for current user
  - [x] `PATCH /api/ai/history/[id]/rate` -- set satisfaction rating (1-5)
  - [x] `GET /api/ai/status` -- query/token status for UI display
  - [x] `POST /api/ai/quiz-score` -- save quiz scores
- [x] Rate limit reset: check at start of every AI query via `src/lib/ai-rate-limit.ts` (atomic Prisma transaction)

### 3.2 Source selection

- [x] Create source drawer component at `src/components/ai/source-drawer.tsx`:
  - Sheet/drawer that slides open from the right
  - Browse content filtered by user's faculty/semester
  - Search by title or module
  - Multi-select with checkboxes
  - "Select all" toggle
  - "Load more" pagination
  - Selected count badge on the drawer trigger button
  - Selected sources shown as removable chips above the chat input (SelectedSourceChips component)
  - [ ] "Upload personal file" button (uploads to Cloudinary under a user-specific folder)

### 3.3 Chat interface

- [x] Create chat components:
  - [x] `src/components/ai/chat-interface.tsx` -- main chat container (resizable panels desktop, sheet mobile)
  - [x] `src/components/ai/chat-message.tsx` -- single message bubble with markdown rendering, copy, rating
  - [x] `src/components/ai/chat-history.tsx` -- side panel with past conversations grouped by date
- [x] Chat interface features:
  - [x] Message input with send button (Enter to send, Shift+Enter for newline)
  - [x] Streaming AI responses (SSE with incremental rendering + cursor animation)
  - [x] "New Chat" button (generates new conversationId)
  - [x] Conversation list in side panel (desktop only), grouped by date (Today/Yesterday/This Week/Older)
  - [x] Click a conversation to reload its messages
  - [x] Delete conversation button (with confirmation dialog)
  - [x] Rate response (1-5 stars) on each AI message
  - [x] Token/query display in header via QueryStatus component (progress bar + countdown timer)
  - [x] Link to token purchase page when balance is low
  - [x] Learning level selector (beginner/intermediate/advanced) in settings popover
  - [x] Chat settings popover: style (default/learning guide/custom), response length, custom instructions textarea

### 3.4 Learning tools

- [x] Create learning studio drawer at `src/components/ai/learning-studio.tsx`
- [x] API route: `POST /api/ai/learning-tool` -- accepts tool type and topic/source IDs, returns structured output
- [x] Each tool has a specific system prompt. Implement prompt builders in `src/lib/gemini.ts`:
  - [x] `buildStudyGuidePrompt(topic, sources, level)` -- returns structured guide
  - [x] `buildMCQPrompt(topic, sources, level)` -- returns 10 MCQs with explanations (JSON format)
  - [x] `buildFillBlanksPrompt(topic, sources, level)` -- returns 10 fill-in-the-blank exercises
  - [x] `buildMatchingPrompt(topic, sources, level)` -- returns column A/B matching
  - [x] `buildTrueFalsePrompt(topic, sources, level)` -- returns 12 T/F with explanations
  - [x] `buildConceptExplainerPrompt(concept, sources, level)` -- returns 6-part explanation
  - [x] `buildStudyPlanPrompt(topic, sources, deadline)` -- returns 2-3 week plan
  - [x] `buildExamPrepPrompt(topic, sources, level)` -- returns exam questions + tips
  - [x] `buildNoteSummaryPrompt(topic, sources)` -- returns bullet-point notes
- [x] Learning tool UI:
  - [x] Grid of 10 tool cards in the Learning Studio drawer
  - [x] Click a tool -> enter topic (or use selected sources) -> generate
  - [x] Loading state with skeleton
  - [x] Rendered output with proper formatting (markdown rendered, quiz questions interactive)
  - [x] MCQ/T-F/Fill-blanks/Matching: interactive quiz with score tracking, save score to QuizScore table
  - [x] Study guide/notes: copy-to-clipboard button
  - [ ] Study plan: save as tasks (optional)

### 3.5 Audio overview

- [x] Create ElevenLabs client at `src/lib/elevenlabs.ts` (uses fetch API directly, no SDK dependency needed)
- [x] API route: `POST /api/ai/audio`:
  1. Accept: sourceContentIds, narrationStyle ("single" or "conversation"), voiceId
  2. Generate podcast script via Gemini (specific prompt for 3-4 minute script)
  3. If ElevenLabs API key is configured: convert script to MP3 via ElevenLabs, return audio as base64
  4. If no ElevenLabs key: return script text only (client uses Web Speech API)
  5. Save AIInteraction with queryType = "audio_overview"
- [x] Audio player component at `src/components/ai/audio-player.tsx`:
  - [x] Play/pause button
  - [x] Progress bar (Slider for HTML5 audio)
  - [x] Download MP3 button (if ElevenLabs was used)
  - [x] Web Speech API fallback: use `SpeechSynthesis` browser API to read the script
  - [x] Voice selection: Web Speech shows browser voices; ElevenLabs voices defined in lib
  - [x] Narration style toggle: single narrator / two-host conversation (in LearningStudio)

### Phase 3 verification

- [ ] AI chat works with source selection (needs live Gemini API key to test)
- [ ] Streaming responses render incrementally
- [ ] Free query limit works (count decreases, locks after 20, resets after suspension period)
- [ ] Token deduction works when free queries are exhausted
- [ ] All 10 learning tools generate correct output
- [ ] MCQ quiz is interactive and saves scores
- [ ] Audio overview generates script and plays audio (Web Speech API at minimum)
- [ ] Chat history persists and can be reloaded
- [ ] Chat settings (level, style, length) affect AI responses

---

## Phase 4: Lecturer experience

### 4.1 Lecturer layout

- [x] Create lecturer sidebar: Dashboard, Upload Content, Manage Content, Analytics, Messages, Settings
- [x] Create lecturer layout at `src/app/_lecturer/layout.tsx` with role guard (LECTURER only)
- [x] Lecturer accesses via `lecturer.localhost:3000` in dev

### 4.2 Lecturer dashboard

- [x] Build dashboard at `src/app/_lecturer/dashboard/page.tsx`:
  - Stats cards: total content uploaded, total views, total downloads, total ratings
  - Recent uploads list (last 5) with per-item view/download count
  - Quick actions: Upload Content, Manage Content, View Analytics, Send Message

### 4.3 Content upload

- [x] Build upload page at `src/app/_lecturer/upload/page.tsx`
- [x] API route: `POST /api/lecturer/content`:
  1. Validate input with Zod (title, module, faculty, semester, program, contentType required)
  2. Verify caller is LECTURER
  3. Upload file to Cloudinary (validate file type: pdf, pptx, docx, jpeg, png; validate size <= 50MB)
  4. Create Content record with fileUrl, filePublicId, fileType, fileSize
  5. Create Notification for students in matching faculty/semester
  6. Return created content
- [x] Upload form UI:
  - [x] Title input
  - [x] Module / course name input
  - [x] Module code input (optional)
  - [x] Faculty dropdown (from Faculty table)
  - [x] Semester dropdown (1 to maxSemesters from AppSettings)
  - [x] Program dropdown (dynamic, filtered by selected faculty)
  - [x] Content type select (lecture notes, assignment, timetable, tutorial, project, lab, other)
  - [x] Description textarea (max 500 chars, char counter)
  - [x] Tutorial link input (optional URL)
  - [x] File upload dropzone with drag-and-drop, file type validation, size display
  - [x] Submit button with loading state
  - [x] Success redirect to content management page

### 4.4 Content management

- [x] Build content management page at `src/app/_lecturer/content/page.tsx`
- [x] API routes:
  - [x] `GET /api/lecturer/content` -- list lecturer's own content
  - [x] `PATCH /api/lecturer/content/[id]` -- update metadata (verify ownership)
  - [x] `DELETE /api/lecturer/content/[id]` -- soft-delete (set status to ARCHIVED, verify ownership)
- [x] Content management UI:
  - [x] Status filter tabs: All / Active / Draft / Archived
  - [x] Search by title
  - [x] Content table: title, module, type, status, views, downloads, rating, date
  - [x] Edit button -> dialog with editable fields (title, module, description, tutorial link, status)
  - [x] Archive button with confirmation
  - [x] Version indicator (increments on edit)

### 4.5 Lecturer analytics

- [x] Build analytics page at `src/app/_lecturer/analytics/page.tsx`
- [x] API route: `GET /api/lecturer/analytics` -- aggregated stats for current lecturer:
  - Total views, downloads, materials count
  - Most-viewed content (top 10)
  - Recent downloads (last 20)
  - Per-content stats table
  - Content type breakdown counts
  - Engagement over time (group by week/month)
- [x] Analytics UI:
  - [x] Summary stat cards
  - [x] Most-viewed content list with bar indicators
  - [x] Recent downloads list with timestamps
  - [x] Full stats table (sortable by views, downloads, rating)
  - [x] Pie chart: content type breakdown. Use a lightweight chart library: `pnpm add recharts`
  - [x] Line chart: views over time (weekly)

### 4.6 Lecturer messaging and settings

- [x] Reuse messaging components from Phase 2 (same API, same UI, just in lecturer layout)
- [x] Reuse settings page structure from Phase 2 (profile, notifications, data export, account deletion)

### Phase 4 verification

- [x] Lecturer can upload files to Cloudinary and see them in content management
- [x] File type and size validation works
- [x] Content metadata can be edited and status changed
- [x] Students receive notifications when new content is uploaded to their faculty/semester
- [x] Analytics show correct view/download counts
- [x] Charts render with real data

---

## Phase 5: Admin experience

### 5.1 Setup wizard

This runs on first deployment, before any other admin features.

- [x] Build setup page at `src/app/(public)/setup/page.tsx`
- [x] The setup page is only accessible when `AppSettings.isSetupComplete === false`
- [x] Redirect away if already set up
- [x] Setup wizard steps:
  1. **University info**: name, logo upload (Cloudinary), primary/secondary colors
  2. **Admin account**: create the first admin user (email, password, name)
  3. **Academic structure**: add faculties (name, code), add programs per faculty (name, code)
  4. **Student ID format**: set the regex pattern for student ID validation (prefilled with `^90500\d{4,}$`)
  5. **API keys**: Gemini API key (required), Resend API key (required), Cloudinary credentials (required), ElevenLabs (optional), Monime/Stripe (optional)
  6. **Policies**: paste or write Terms of Service, Privacy Policy, Code of Conduct (provide default templates)
  7. **Review and finish**: summary of all settings, "Complete Setup" button
- [x] On completion: set `isSetupComplete = true`, redirect to `admin.localhost:3000/dashboard`
- [x] API route: `POST /api/setup` -- validates and saves all wizard data in one transaction

### 5.2 Admin layout and dashboard

- [x] Create admin sidebar: Dashboard, Users, Analytics, Settings, Flags, Reports, Lecturer Codes, Bulk Messages
- [x] Create admin layout at `src/app/_admin/layout.tsx` with role guard (ADMIN only)
- [x] Build dashboard at `src/app/_admin/dashboard/page.tsx`:
  - Stats cards: total users (students/lecturers/admins), total content, total AI interactions
  - Recent registrations list (last 10)
  - Recent AI queries (last 10)
  - Quick links: User Management, Analytics, Settings, Flags, Reports

### 5.3 User management

- [x] Build users page at `src/app/_admin/users/page.tsx`
- [x] API routes:
  - [x] `GET /api/admin/users` -- paginated user list with filters (role, search by name/email)
  - [x] `PATCH /api/admin/users/[id]` -- update user (change role, suspend/unsuspend, deactivate). Log to AuditLog.
  - [x] `DELETE /api/admin/users/[id]` -- soft-delete user (set deletedAt). Log to AuditLog.
  - [x] `GET /api/admin/users/[id]` -- full user detail (profile, activity summary, flag/report history)
- [x] User management UI:
  - [x] Search input (name or email)
  - [x] Role filter tabs: All / Students / Lecturers / Admins
  - [x] User table: name, email, role, faculty, registered date, status
  - [x] Row actions: View Details, Change Role, Suspend, Delete
  - [x] User detail sheet/modal: profile info, content uploaded count, AI queries count, reports against them
  - [x] Confirmation dialogs for destructive actions (suspend, delete)

### 5.4 University settings

- [x] Build settings page at `src/app/_admin/settings/page.tsx`
- [x] API routes:
  - [x] `GET /api/admin/settings` -- return AppSettings
  - [x] `PATCH /api/admin/settings` -- update settings. Log to AuditLog.
  - [x] `POST /api/admin/faculties` -- add faculty
  - [x] `PATCH /api/admin/faculties/[id]` -- update faculty
  - [x] `DELETE /api/admin/faculties/[id]` -- deactivate faculty (soft)
  - [x] `POST /api/admin/programs` -- add program
  - [x] `PATCH /api/admin/programs/[id]` -- update program
  - [x] `DELETE /api/admin/programs/[id]` -- deactivate program (soft)
- [x] Settings UI:
  - [x] Tabs: General, Academic Structure, API Keys, Policies, Token Pricing
  - [x] General: university name, logo, colors, domain, student ID pattern
  - [x] Academic structure: faculty list with inline add/edit, programs nested under each faculty
  - [x] API keys: masked display with "Update" buttons (never show full keys after initial entry)
  - [x] Policies: rich text or markdown editor for TOS, privacy policy, code of conduct, content policy
  - [x] Token pricing: JSON editor for token packages, referral bonus amount, free queries/day, suspension hours

### 5.5 Content moderation

- [x] Build flags page at `src/app/_admin/flags/page.tsx`
- [x] API routes:
  - [x] `GET /api/admin/flags` -- list content flags, filterable by status (pending/reviewed/resolved)
  - [x] `PATCH /api/admin/flags/[id]` -- resolve flag: approve (dismiss), remove content, warn uploader, suspend uploader. Log to AuditLog.
- [x] Flags UI:
  - [x] Tabs: Pending / Reviewed / Resolved
  - [x] Flag cards: flagged content title, reporter name, reason, date
  - [x] Expand to see: content preview (link to content), reporter details, content author
  - [x] Actions: Dismiss (mark as reviewed, no action), Remove Content (set status ARCHIVED), Warn Uploader (send notification), Suspend Uploader (set isSuspended = true)
  - [x] Resolution notes textarea

### 5.6 User reports

- [x] Build reports page at `src/app/_admin/reports/page.tsx`
- [x] API routes:
  - [x] `GET /api/admin/reports` -- list user reports, filterable by status
  - [x] `PATCH /api/admin/reports/[id]` -- resolve report: dismiss, warn user, suspend user, ban user. Log to AuditLog.
- [x] Reports UI:
  - [x] Similar structure to flags page
  - [x] Report cards: reported user, reporter, reason, context (link to message/post), date
  - [x] Actions: Dismiss, Warn (notification), Suspend (with reason), Ban (permanent deactivation)
  - [x] Admin notes field

### 5.7 Lecturer codes

- [x] Build codes page at `src/app/_admin/codes/page.tsx`
- [x] API routes:
  - [x] `GET /api/admin/lecturer-codes` -- list all codes (active and revoked)
  - [x] `POST /api/admin/lecturer-codes` -- create new code (hash before storing)
  - [x] `DELETE /api/admin/lecturer-codes/[id]` -- revoke code (set revokedAt)
- [x] Codes UI:
  - [x] Table: code (masked after creation), lecturer name, faculty, status, created date
  - [x] "Generate New Code" button -> dialog: lecturer name, faculty, generates random code, shows code ONCE (user must copy it)
  - [x] Revoke button with confirmation

### 5.8 Bulk messaging

- [x] Build bulk messages page at `src/app/_admin/messages/page.tsx`
- [x] API route: `POST /api/admin/messages/bulk`:
  - Accept: subject, body, filter (all users, specific role, specific faculty, specific semester)
  - Create Message records for each matching user
  - Create Notification records
  - Optionally send email via Resend (with rate limiting)
- [x] Bulk message UI:
  - [x] Recipient filter: All Users / All Students / All Lecturers / Specific Faculty / Specific Semester
  - [x] Subject input
  - [x] Message body textarea
  - [x] Preview: "This will be sent to X users"
  - [x] Send button with confirmation

### 5.9 Audit log

- [x] API route: `GET /api/admin/audit-log` -- paginated, filterable by action type, user, date range
- [x] Viewable from admin dashboard or a dedicated audit page
- [x] Table: timestamp, admin name, action description, entity affected

### Phase 5 verification

- [x] Setup wizard creates AppSettings, admin user, faculties, programs
- [x] Second visit to /setup redirects away
- [x] Admin can CRUD users, faculties, programs
- [x] Lecturer codes can be created, shown once, and revoked
- [x] Content flags are reviewable and resolvable
- [x] User reports flow works end-to-end
- [x] Bulk messages reach the correct audience
- [x] Audit log records all admin actions
- [x] All admin routes reject non-admin users

---

## Phase 6: Payments and referrals

### 6.1 Token system

- [ ] API routes:
  - [ ] `GET /api/tokens/balance` -- return TokenBalance for current user (create if not exists)
  - [ ] `GET /api/tokens/transactions` -- transaction history, paginated
  - [ ] `POST /api/tokens/purchase` -- create payment order:
    1. Validate package selection against AppSettings.tokenPackages
    2. Create TokenTransaction with status PENDING
    3. Call payment provider (Monime or Stripe) to create order
    4. Return order details (USSD prompt info for Monime, Stripe checkout URL for Stripe)
  - [ ] `POST /api/webhooks/monime/route.ts` -- Monime payment confirmation:
    1. Verify webhook signature
    2. Find TokenTransaction by paymentReference
    3. Update transaction status to COMPLETED
    4. Credit tokens to TokenBalance
    5. Create Notification
  - [ ] `POST /api/webhooks/stripe/route.ts` -- Stripe webhook:
    1. Verify webhook signature with stripe.webhooks.constructEvent()
    2. Same flow as Monime webhook
- [ ] Install Stripe: `pnpm add stripe`
- [ ] Create payment adapters at `src/lib/payments/monime.ts` and `src/lib/payments/stripe.ts`

### 6.2 Token purchase UI

- [ ] Build tokens page at `src/app/(student)/tokens/page.tsx`:
  - Balance display: available, used, total tokens
  - Currency toggle (from AppSettings)
  - Package cards: show each token package with price, "Popular" badge on the recommended one
  - Purchase flow: select package -> enter phone number (Monime) or redirect to Stripe checkout -> show order confirmation with reference number
  - Transaction history table below

### 6.3 Referral system

- [ ] API routes:
  - [ ] `GET /api/referrals` -- referral history for current user
  - [ ] `POST /api/referrals/process` -- called during registration if a referral code is present:
    1. Find referrer by referralCode
    2. Create Referral record
    3. Credit bonus tokens to both referrer and referee
    4. Create Notifications for both
- [ ] Build referrals page at `src/app/(student)/referrals/page.tsx`:
  - Your referral code displayed prominently
  - Share buttons: WhatsApp (pre-filled message with link), SMS, copy-to-clipboard
  - Referral history: table of referred users (name, date, status, tokens earned)
  - Total bonus tokens earned

### Phase 6 verification

- [ ] Token balance displays correctly
- [ ] Payment flow works (Monime USSD or Stripe checkout)
- [ ] Webhook credits tokens after payment confirmation
- [ ] AI queries deduct tokens when free queries are exhausted
- [ ] Referral code is generated on registration
- [ ] Referral link works: new user signs up, both users get bonus tokens

---

## Phase 7: DPG compliance features

These features exist specifically to meet DPG Standard requirements. They're not optional.

### 7.1 Data export (Indicator 6)

- [x] API route: `GET /api/users/me/export`:
  1. Gather all user data: profile, tasks, schedule, messages (sent), AI interactions, quiz scores, learning goals, content ratings, referrals
  2. Package as JSON
  3. Return as downloadable .json file with Content-Disposition header
- [x] CSV export variant for tabular data:
  - [x] `GET /api/users/me/export?format=csv&type=quiz_scores` -- returns CSV of quiz scores
  - [x] `GET /api/users/me/export?format=csv&type=content_access` -- returns CSV of content access history
- [x] Admin export:
  - [x] `GET /api/admin/export` -- platform-wide anonymized data export (user counts by faculty, content engagement aggregates, AI usage stats)
- [x] UI: "Export My Data" button in Settings page. Shows options: Full JSON export, Quiz scores CSV, Content access CSV.

### 7.2 Account deletion (Indicator 7, 9a)

- [x] API route: `DELETE /api/users/me`:
  1. Set deletedAt to current timestamp
  2. Set isActive to false
  3. Schedule data purge for 7 days from now (use a cron job or check on next server request)
  4. Send confirmation email: "Your account deletion has been requested. You have 7 days to cancel."
  5. Return success
- [x] API route: `POST /api/users/me/cancel-deletion`:
  1. Clear deletedAt
  2. Set isActive to true
- [x] Data purge logic (runs as a scheduled function or checked on API requests):
  1. Find users where deletedAt < now() - 7 days
  2. Delete: Messages (where senderId = user), AIInteractions, Tasks, TaskInvitations, Schedule, QuizScores, LearningGoals, ForumPosts, ForumVotes, TokenBalance, TokenTransactions, Referrals, ContentRatings, Notifications
  3. Anonymize: ContentAccess (set userId to "deleted-user-HASH")
  4. Delete: User record, Account records, Session records
  5. Don't delete Content uploaded by lecturers -- reassign to admin
- [x] UI: "Delete Account" button in Settings, behind a confirmation dialog with: warning text, reason input (optional), password confirmation, "Delete My Account" button

### 7.3 Privacy policy and terms display

- [x] Build pages:
  - [x] `src/app/(public)/terms/page.tsx` -- renders AppSettings.termsOfService as markdown
  - [x] `src/app/(public)/privacy/page.tsx` -- renders AppSettings.privacyPolicy as markdown
  - [x] `src/app/(public)/conduct/page.tsx` -- renders AppSettings.codeOfConduct as markdown
- [x] Install markdown renderer: `pnpm add react-markdown`
- [x] Link from: footer, registration page, settings page, forum page, messaging page

### 7.4 Discussion forum (Indicator 9c)

- [x] Build forum pages:
  - [x] `src/app/(student)/forum/page.tsx` -- list modules with post counts
  - [x] `src/app/(student)/forum/[module]/page.tsx` -- posts for a specific module
- [x] API routes:
  - [x] `GET /api/forum?module=X&facultyId=Y` -- list posts, paginated, sorted by newest or most upvoted
  - [x] `POST /api/forum` -- create post or reply
  - [x] `POST /api/forum/[id]/vote` -- toggle upvote
  - [x] `PATCH /api/forum/[id]/accept` -- mark reply as accepted answer (only original poster can do this)
  - [x] `POST /api/forum/[id]/report` -- report post (creates UserReport)
- [x] Forum UI:
  - [x] Module list with post count badges
  - [x] Post list: title, author, date, upvote count, reply count, accepted answer indicator
  - [x] Post detail: body, replies (threaded), upvote button, report button
  - [x] Reply form
  - [x] Lecturers can pin posts in their modules
  - [x] Link to code of conduct visible on forum pages

### 7.5 Accessibility (Indicator 8)

- [x] Audit all components for WCAG 2.1 AA:
  - [ ] Color contrast: verify all text meets 4.5:1 ratio. Use browser dev tools or a contrast checker. Pay special attention to the dark theme.
  - [ ] Keyboard navigation: tab through every page, ensure all interactive elements are reachable. Add tabIndex where needed. Ensure no keyboard traps.
  - [x] Focus indicators: visible focus rings on all interactive elements. shadcn/ui handles most of this.
  - [x] Screen readers: add aria-label to icon buttons, aria-live regions for dynamic content (notifications, chat messages, loading states), role attributes where semantic HTML is insufficient.
  - [x] Form accessibility: every input has a label (shadcn Label component), error messages use aria-describedby.
  - [x] Alt text: all images including avatars, file type icons, university logo.
  - [x] Reduced motion: wrap animations in `prefers-reduced-motion` media query. Tailwind v4: use `motion-safe:` and `motion-reduce:` variants.
  - [ ] Responsive: test at 320px width. Test at 200% browser zoom.
- [x] Add `<html lang="en">` to root layout
- [x] Add skip-to-content link as first focusable element
- [x] Light/dark theme toggle (already set up with next-themes)

### Phase 7 verification

- [ ] Data export downloads a complete JSON file of all user data
- [ ] CSV export works for quiz scores and content access
- [ ] Account deletion sets grace period, purge runs after 7 days
- [ ] Deletion can be cancelled within grace period
- [ ] Privacy policy and terms render from database content
- [ ] Forum posts, replies, upvotes, and accepted answers work
- [ ] Forum reports create entries in the admin queue
- [ ] Pass axe-core accessibility scan with zero critical violations
- [ ] All pages navigable by keyboard
- [ ] Screen reader announces dynamic content changes

---

## Phase 8: Testing

### 8.1 Setup

- [ ] Install Vitest: `pnpm add -D vitest @vitejs/plugin-react`
- [ ] Install Playwright: `pnpm add -D @playwright/test` then `pnpm dlx playwright install`
- [ ] Install test utilities: `pnpm add -D @testing-library/react @testing-library/jest-dom`
- [ ] Create `vitest.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/helpers/setup.ts'],
      include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  })
  ```
- [ ] Create `playwright.config.ts` with base URL `http://localhost:3000`
- [ ] Create `tests/helpers/db.ts` -- test database setup: uses a separate test database, runs migrations, provides cleanup functions
- [ ] Create `tests/helpers/fixtures.ts` -- factory functions: createTestUser(), createTestContent(), createTestMessage(), etc.
- [ ] Add test scripts to `package.json`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:coverage": "vitest run --coverage"
  ```

### 8.2 Unit tests

Write unit tests for every API route and utility function. Target: every happy path and at least one error path per route.

**Auth tests** (`tests/unit/api/auth.test.ts`):
- [ ] Registration: valid input creates user, duplicate email rejected, invalid student ID rejected, invalid lecturer code rejected
- [ ] Login: correct credentials return session, wrong password returns 401, nonexistent email returns 401
- [ ] Role setup: student ID validation, lecturer code validation, admin code validation
- [ ] Email verification: valid token verifies email, expired token rejected

**Content tests** (`tests/unit/api/content.test.ts`):
- [ ] List: returns only content matching user's faculty/semester, pagination works, search filters work
- [ ] Create: valid input creates content (lecturer only), non-lecturer rejected, file validation works
- [ ] Update: owner can update, non-owner rejected, version increments
- [ ] Delete: owner can delete, non-owner rejected, admin can delete
- [ ] Access logging: view/download creates ContentAccess, increments counters
- [ ] Rating: creates rating, updates existing rating, validates 1-5 range
- [ ] Flagging: creates ContentFlag, duplicate flag by same user rejected

**AI tests** (`tests/unit/api/ai.test.ts`):
- [ ] Query: respects rate limit, deducts free queries, deducts tokens when free exhausted, rejects when both exhausted
- [ ] Rate limit reset: queries allowed again after reset time
- [ ] History: returns only current user's interactions, delete works
- [ ] Learning tools: each tool type returns properly structured JSON

**Message tests** (`tests/unit/api/messages.test.ts`):
- [ ] Send: creates message, blocked user cannot send, recipient gets notification
- [ ] Read: mark as read works, only recipient can mark
- [ ] Block: creates block, blocked user cannot send messages
- [ ] Report: creates UserReport

**Task tests** (`tests/unit/api/tasks.test.ts`):
- [ ] CRUD: create, read, update, delete. Only owner can modify.
- [ ] Invitation: creates invitation, sends notification

**Admin tests** (`tests/unit/api/admin.test.ts`):
- [ ] User management: list, search, filter by role, change role, suspend, delete
- [ ] Settings: read and update AppSettings
- [ ] Flags: list, resolve with different actions
- [ ] Reports: list, resolve with different actions
- [ ] Lecturer codes: create, revoke
- [ ] Bulk messages: sends to correct recipients
- [ ] Audit log: admin actions are logged
- [ ] All admin routes reject non-admin callers

**Token tests** (`tests/unit/api/tokens.test.ts`):
- [ ] Balance: returns correct balance, creates record if none exists
- [ ] Purchase: creates pending transaction
- [ ] Webhook: credits tokens on valid webhook, rejects invalid signature
- [ ] Deduction: decrements balance, rejects when insufficient

**Validator tests** (`tests/unit/validators/`):
- [ ] Each Zod schema: valid input passes, each invalid field type/format is rejected

**Utility tests** (`tests/unit/lib/`):
- [ ] Referral code generation: unique, correct format
- [ ] Date formatters: edge cases
- [ ] File size formatter: bytes, KB, MB, GB

### 8.3 Integration tests

These hit the actual database (test database). Test complete flows.

- [ ] `tests/integration/auth.test.ts`:
  - Register user -> verify email -> login -> check session -> logout
  - Register with referral code -> both users get tokens
- [ ] `tests/integration/content.test.ts`:
  - Lecturer uploads content -> student sees it -> student rates it -> lecturer sees rating in analytics
  - Student flags content -> admin resolves flag -> content removed
- [ ] `tests/integration/ai.test.ts`:
  - Student uses 20 free queries -> gets rate limited -> buys tokens -> can query again
  - Student sends query with sources -> interaction saved -> appears in history -> deletable
- [ ] `tests/integration/admin.test.ts`:
  - Admin creates lecturer code -> lecturer registers with it -> admin revokes code -> new lecturer can't use it

### 8.4 E2E tests (Playwright)

Test full user flows through the browser.

- [ ] `tests/e2e/registration.spec.ts`:
  - Student registration: fill form, verify redirect to student dashboard
  - Lecturer registration: fill form with code, verify redirect to lecturer dashboard
  - Google OAuth: click button, handle OAuth flow (mock), verify redirect
- [ ] `tests/e2e/student-flow.spec.ts`:
  - Login -> browse content -> view a PDF -> rate it -> check progress page shows rating
  - Create task -> set deadline -> verify countdown appears -> mark complete
  - Send message -> check inbox as recipient -> reply
- [ ] `tests/e2e/lecturer-flow.spec.ts`:
  - Login -> upload content -> verify appears in management page -> edit metadata -> archive
  - Check analytics page shows upload with 0 views
- [ ] `tests/e2e/admin-flow.spec.ts`:
  - Login -> manage users -> change a user's role -> verify change persists
  - Review content flag -> remove content -> verify content no longer visible
- [ ] `tests/e2e/ai-chat.spec.ts`:
  - Login -> select sources -> send message -> verify streaming response appears
  - Use a learning tool -> verify structured output renders
  - Check query count decreases

### Phase 8 verification

- [ ] `pnpm test` passes all unit and integration tests
- [ ] `pnpm test:e2e` passes all E2E tests
- [ ] `pnpm test:coverage` shows 70%+ coverage
- [ ] No test depends on external APIs (Gemini, Cloudinary, etc. are mocked)

---

## Phase 9: Documentation and deployment

### 9.1 Documentation

- [ ] Write `README.md`:
  - Project description (2 paragraphs, link to SDGs)
  - Screenshot or demo GIF
  - Quick start (5-step local dev setup)
  - Tech stack table
  - Architecture overview (subdomain routing explanation)
  - Link to /docs for detailed guides
  - License (MIT)
  - Contributing link
- [ ] Write `CONTRIBUTING.md`:
  - How to set up local dev environment (prerequisites, clone, install, env vars, database, seed)
  - Code style (ESLint + Prettier config shipped with the project)
  - Branch naming convention
  - How to submit a pull request (fork, branch, PR with description)
  - How to report bugs (issue template)
  - How to request features (issue template)
  - Code review process
- [ ] Write `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1)
- [ ] Write `LICENSE` (MIT license text)
- [ ] Write `docs/self-hosting.md`:
  - Prerequisites (Docker, Docker Compose, domain with DNS)
  - Step-by-step deployment guide
  - Configuring subdomains (wildcard DNS, reverse proxy with Nginx/Caddy)
  - SSL setup (Let's Encrypt with Caddy)
  - Backup strategy (pg_dump cron)
  - Updating to new versions (git pull, docker-compose up --build)
- [ ] Write `docs/configuration.md`:
  - All environment variables documented with descriptions and examples
  - AppSettings fields explained
  - Payment provider setup (Monime, Stripe)
  - AI provider setup (Gemini API key)
  - Email setup (Resend)
  - File storage setup (Cloudinary)
- [ ] Write `docs/api-reference.md`:
  - Every API route documented: method, path, auth requirement, request body, response format
  - Use a consistent format for each endpoint
- [ ] Create GitHub issue templates:
  - Bug report template
  - Feature request template

### 9.2 Docker deployment

- [ ] Write `Dockerfile`:
  ```dockerfile
  FROM node:20-alpine AS base
  RUN corepack enable && corepack prepare pnpm@latest --activate

  FROM base AS deps
  WORKDIR /app
  COPY package.json pnpm-lock.yaml ./
  RUN pnpm install --frozen-lockfile

  FROM base AS builder
  WORKDIR /app
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  RUN pnpm dlx prisma generate
  RUN pnpm build

  FROM base AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/.next/standalone ./
  COPY --from=builder /app/.next/static ./.next/static
  COPY --from=builder /app/prisma ./prisma
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```
- [ ] Add `output: 'standalone'` to `next.config.ts`
- [ ] Write `docker-compose.yml`:
  ```yaml
  services:
    app:
      build: .
      ports:
        - "3000:3000"
      environment:
        - DATABASE_URL=postgresql://uninotepad:uninotepad@db:5432/uninotepad
      depends_on:
        db:
          condition: service_healthy
      restart: unless-stopped

    db:
      image: postgres:16-alpine
      environment:
        POSTGRES_USER: uninotepad
        POSTGRES_PASSWORD: uninotepad
        POSTGRES_DB: uninotepad
      volumes:
        - postgres_data:/var/lib/postgresql/data
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U uninotepad"]
        interval: 5s
        timeout: 5s
        retries: 5
      restart: unless-stopped

  volumes:
    postgres_data:
  ```
- [ ] Add migration command to Docker startup (or as an entrypoint script):
  ```sh
  npx prisma migrate deploy && node server.js
  ```
- [ ] Test: `docker-compose up --build` -> visit `http://localhost:3000` -> complete setup wizard -> verify everything works

### 9.3 Seed data

- [ ] Write `prisma/seed.ts`:
  - Creates default AppSettings record
  - For development: creates sample faculties, programs, users (1 admin, 2 lecturers, 5 students), sample content, sample AI interactions
  - Configurable: `SEED_MODE=minimal` creates only AppSettings, `SEED_MODE=full` creates all sample data
- [ ] Add seed command to `package.json`:
  ```json
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
  ```

### Phase 9 verification

- [ ] README is clear enough for someone to set up from scratch
- [ ] CONTRIBUTING.md covers the full contributor workflow
- [ ] Docker build completes without errors
- [ ] docker-compose up starts the full application
- [ ] Setup wizard works in Docker environment
- [ ] Seed script creates sample data
- [ ] All documentation links work
- [ ] LICENSE file present with MIT text

---

## Dependency install checklist

Run these once during Phase 1 setup:

```bash
# Core
pnpm add next@latest react@latest react-dom@latest
pnpm add prisma @prisma/client
pnpm add next-auth@beta @auth/prisma-adapter
pnpm add bcryptjs
pnpm add zod
pnpm add @tanstack/react-query

# UI
pnpm add next-themes
pnpm add react-markdown
pnpm add recharts
pnpm add pdfjs-dist

# Services
pnpm add @google/generative-ai
pnpm add cloudinary
pnpm add resend
pnpm add elevenlabs
pnpm add stripe

# Dev
pnpm add -D @types/bcryptjs
pnpm add -D vitest @vitejs/plugin-react
pnpm add -D @playwright/test
pnpm add -D @testing-library/react @testing-library/jest-dom
pnpm add -D tsx                    # for seed script
pnpm add -D prettier eslint
```

---

## Environment checklist

Before starting development, ensure you have:

- [ ] Node.js 20.9+ installed
- [ ] pnpm installed (`corepack enable && corepack prepare pnpm@latest --activate`)
- [ ] PostgreSQL running locally (or use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16-alpine`)
- [ ] Cloudinary account with cloud name, API key, API secret
- [ ] Google Gemini API key (from Google AI Studio)
- [ ] Resend API key (free tier: 100 emails/day)
- [ ] Google OAuth credentials (from Google Cloud Console)
- [ ] Facebook OAuth credentials (from Meta Developer Portal)
- [ ] Optional: ElevenLabs API key
- [ ] Optional: Monime API key / Stripe secret key
`;

export default function ImplementationPlan() {
  const handleDownload = () => {
    const blob = new Blob([PRD_CONTENT], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'implementation_plan_uninotepad.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Implementation Plan</h1>
              <p className="text-sm text-gray-400 mt-1">UniNotepad -- Full build guide -- March 2026</p>
            </div>
            <button
              onClick={handleDownload}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
            >
              Download .md
            </button>
          </div>
          <pre className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap overflow-auto max-h-[70vh]">
            {PRD_CONTENT}
          </pre>
        </div>
      </div>
    </div>
  );
}

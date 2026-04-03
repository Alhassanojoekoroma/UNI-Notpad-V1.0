// PRD -- UniNotepad (formerly LUSL Notepad)
// Open-source university learning platform
// DPG Standard-aligned

export const PRD_CONTENT = `
# Product requirements document
## UniNotepad -- Open-source university learning platform
Version: 2.0 | Date: March 2026 | License: MIT

---

## 1. What this is

UniNotepad is an open-source learning platform built for universities in developing countries. Students use it to access course materials, study with an AI assistant, track grades, and collaborate with classmates. Lecturers upload and manage content. Admins run the show.

The project started as LUSL Notepad at Limkokwing University Sierra Leone in early 2026. It worked, students used it, and we learned what mattered. This version is a ground-up rebuild designed to run at any university, not just ours.

Any institution can clone the repo, configure their branding and academic structure, and deploy their own instance. We also run a hosted version for universities that prefer not to manage infrastructure.

### Why it exists

Most students at African universities can't afford ChatGPT subscriptions. Course materials live on random WhatsApp groups or don't exist digitally at all. Lecturers email PDFs around. Nobody knows what's being used or ignored.

UniNotepad puts all of that in one place and adds an AI study assistant that works with the actual course materials. It's free to deploy, free to modify, and built on open-source tools from top to bottom.

### Sustainable Development Goals

This project targets three specific SDGs:

- SDG 4.3 (equal access to affordable higher education) -- gives students free access to organized course materials and AI-powered study tools, regardless of economic background
- SDG 4.4 (relevant skills for employment) -- the AI study tools help students build deeper understanding of technical subjects
- SDG 4.a (effective learning environments) -- replaces scattered WhatsApp groups and photocopied handouts with a structured digital platform

We don't claim to solve education. We solve the specific problem of students not having organized access to their own course materials and affordable study tools.

---

## 2. Architecture

### Subdomain routing

Each user role gets its own subdomain. A single Next.js 16+ application handles all of them through middleware-based routing.

| Subdomain | Who it's for | Example |
|-----------|-------------|---------|
| lunsl.org (root) | Public | Landing page, registration, login |
| lunsl.org/* | Students | Dashboard, content, AI assistant, progress |
| admin.lunsl.org | Administrators | User management, analytics, system config |
| lecturer.lunsl.org | Lecturers | Upload, manage content, view analytics |

The root domain serves the university landing page and handles authentication. After login, users are redirected to their role's subdomain. Each subdomain shares the same Next.js app but loads different layouts and page trees based on the host header.

For self-hosted deployments, the domain is configurable. A university running their own instance at uniexample.edu would get uniexample.edu, admin.uniexample.edu, and lecturer.uniexample.edu.

### Standalone-first design

The platform is a single Docker-composable application. A university IT team can deploy it with:

1. Clone the repo
2. Copy .env.example to .env, fill in database credentials and API keys
3. Run docker-compose up
4. Access the setup wizard at /setup to configure university name, faculties, programs, and branding

No dependency on us. No phone-home. No license server. The MIT license means they can fork it and never look back.

### Hosted option

For universities without IT capacity, we run a multi-tenant hosted version. Each university gets their own subdomain namespace (e.g., makerere.uninotepad.org) and isolated database schema. The hosted version is the same codebase with a tenant resolution layer on top.

---

## 3. Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16+ (App Router) | Server components, middleware routing, API routes |
| Database | PostgreSQL + Prisma ORM | Open-source, reliable, good migration tooling |
| Auth | NextAuth.js v5 | Email/password, Google OAuth, Facebook OAuth |
| AI | Google Gemini API | Generous free tier, good multilingual support |
| TTS | Web Speech API (free) / ElevenLabs (optional) | Free default, premium option for better voices |
| File storage | Local disk / S3-compatible (MinIO for self-hosted) | No vendor lock-in |
| Payments | Monime (mobile money) / Stripe (international) | Configurable per deployment |
| Email | Nodemailer + any SMTP provider | Self-hostable, no vendor lock |
| UI components | shadcn/ui + Tailwind CSS v4 | Accessible, composable, no vendor lock-in |
| Caching | TanStack Query (client), Redis (optional server) | Fast UI, optional server cache |
| Deployment | Docker + docker-compose | One-command deployment |

Every external service has an open-source fallback. Gemini can be swapped for Ollama (local LLM). S3 storage can be swapped for MinIO. ElevenLabs can be swapped for the browser's built-in Web Speech API. The payment layer is behind an adapter interface, so adding new providers means writing one file.

---

## 4. Authentication

NextAuth.js handles all authentication. Three providers are configured out of the box:

**Email and password** -- the default. Students in Sierra Leone often don't have Google accounts, so this has to work well. Passwords are hashed with bcrypt. Email verification is required.

**Google OAuth** -- for students and staff who prefer it.

**Facebook OAuth** -- widely used in West Africa. Many students have Facebook but not Google accounts.

### Registration flow

1. User visits lunsl.org and clicks Register
2. Chooses auth method (email/password, Google, or Facebook)
3. After authentication, lands on the profile setup page
4. Selects role: Student, Lecturer, or Admin
5. Role-specific fields appear:
   - Student: enters Student ID (format validated against university rules stored in DB), system looks up faculty/semester/program
   - Lecturer: enters access code (validated against codes in the database, which admins can rotate)
   - Admin: enters admin access code (validated server-side)
6. Accepts terms of service and privacy policy (both linked, both required)
7. Redirected to role-specific subdomain

### Session handling

Sessions are stored server-side in the database (Prisma adapter). JWT fallback is available for deployments that want stateless auth. Sessions persist across browser restarts. Inactivity timeout is configurable (default: 7 days).

---

## 5. Users and permissions

### Students

Students are the primary users. After registration, they can:

- Browse and download course materials filtered to their faculty, semester, and program
- Use the AI study assistant with 10 learning tools
- Manage personal tasks with deadlines, priorities, and collaboration
- Manage their weekly schedule
- Send and receive messages from other students and lecturers
- Track quiz scores and learning goals
- Purchase AI tokens via mobile money
- Earn bonus tokens by referring friends
- Export their data (notes, scores, history) in JSON or CSV format
- Delete their account and all associated data

### Lecturers

Lecturers upload and manage content. They can:

- Upload course materials (PDF, PPTX, DOCX, images) up to 50MB
- Tag content with faculty, semester, program, module, and content type
- Edit or archive uploaded materials
- View analytics on their content (views, downloads, ratings)
- Send messages to students
- Export their content metadata and analytics
- Flag inappropriate content uploaded by other lecturers (escalated to admin)

### Administrators

Admins manage the platform instance. They can:

- View platform-wide analytics (users, content, AI usage)
- Manage users (view, change roles, deactivate, delete)
- Configure university settings: name, logo, faculties, programs, semesters, student ID format
- Manage lecturer access codes (create, rotate, revoke)
- Review flagged content and take action (approve, remove, warn uploader)
- Review user reports and take action (warn, suspend, ban)
- Send bulk messages
- View and manage token transactions
- Export platform data for institutional reporting
- Configure payment providers and token pricing

---

## 6. Features

### 6.1 Student dashboard

The dashboard shows a time-based greeting and the student's academic info. Below that, a card layout with:

**Task manager** -- students add tasks with a title, deadline, priority (high/medium/low), and optional tags. Tasks with upcoming deadlines show countdown timers. Students can invite classmates to collaborate on tasks by email. Overdue tasks trigger in-app notifications.

**Schedule manager** -- weekly timetable view. Students add entries with day, time, subject, location, and type (lecture, tutorial, lab). A mini calendar highlights today. Timetables uploaded by lecturers also appear here.

**Quick stats** -- cards showing unread messages, upcoming deadlines, recent quiz scores, and AI queries remaining today.

**Global search** -- searches across tasks, schedule entries, course materials, and messages from one input field.

### 6.2 Course materials

Students browse materials filtered to their faculty, semester, and program. The filtering runs server-side (Prisma query) and is verified client-side. A student in FICT Semester 3 cannot see FBMG Semester 5 materials, period.

Browsing features:
- Search by title or module name
- Filter by module, lecturer, content type
- Sort by newest, most viewed, or most downloaded
- Pagination (30 items per page, load-more button)
- File type badges with color coding
- Content cards show lecturer name, module code, semester, and average rating

Opening materials:
- PDFs open in an in-app viewer (pdf.js) with annotation and highlighting support
- PPTX files open via Google Slides viewer
- All file types are downloadable
- Every view and download is logged to ContentAccess

Content rating:
- Students rate materials 1-5 stars after viewing
- Optional written feedback
- Ratings are visible to the lecturer and to other students

### 6.3 AI study assistant

The core feature. Students chat with an AI (Gemini) that has access to their actual course materials.

**Source selection** -- before asking a question, students pick which materials the AI should reference. A drawer lets them browse, search, and multi-select course materials. They can also upload personal notes (PDF, PPTX, DOCX, images) as additional sources. The AI's answers cite specific sources when possible.

**Chat interface** -- real-time streaming responses. Chat history is stored in the database and accessible from a side panel on desktop. Students can start new conversations, continue old ones, and delete history items.

**Learning tools** (accessible from a "Learning Studio" drawer):

1. Study guide -- structured topic overview with key concepts and worked examples
2. Practice quiz (MCQ) -- 10 multiple-choice questions with explanations for each answer
3. Fill in the blanks -- 10 exercises with hidden answers
4. Matching quiz -- column A/B matching with answer key
5. True/false quiz -- 12 questions with explanations
6. Concept explainer -- breaks a concept into 6 parts: definition, analogy, example, common mistakes, related concepts, and summary
7. Study plan -- generates a 2-3 week study schedule based on selected materials and upcoming deadlines
8. Audio overview -- generates a podcast-style summary from selected materials, converted to audio via Web Speech API (free) or ElevenLabs (premium)
9. Exam prep -- exam-style questions, priority topics, and study tips based on the syllabus
10. Note summary -- bullet-point notes with key terms in bold

**Learning level** -- students choose beginner (simple language, lots of analogies), intermediate (balanced), or advanced (precise technical language). The AI adjusts accordingly.

**Chat settings** -- conversational style (default, learning guide, or custom), response length (default, shorter, longer), and a custom instructions field.

**Rate limiting and tokens:**
- Free tier: 20 AI queries per day. After that, a 7-hour cooldown. The remaining count and reset timer are visible in the chat header.
- Paid tier: 1 query = 1 token. Tokens are purchased via mobile money or card.
- Token balance is always visible. A link to buy more appears when the balance is low.

**Interaction logging:**
- Every query/response pair is saved with: user ID, query text, response text, source IDs, query type, timestamp, and response time
- Students can rate AI responses (1-5 stars)
- History panel groups past interactions by date
- Students can delete individual history items or clear all history

**Audio overview details:**
- Two modes: single narrator or two-host conversation
- Voice selection (Web Speech API voices vary by browser; ElevenLabs offers George, Bella, Daniel, Dorothy)
- AI generates a 3-4 minute script, then the TTS engine converts it to audio
- In-app audio player with play/pause and download-as-MP3

### 6.4 Lecturer dashboard

Shows upload stats (total content, total views, total downloads) and a list of recent uploads with per-item engagement numbers. Quick action buttons for upload, manage, analytics, and messaging. Content is listed by status: active, draft, or archived.

### 6.5 Content upload (lecturer)

Form with the following fields:

- Title (required)
- Module / course name (required)
- Module code (optional)
- Faculty (required, selected from database-driven list)
- Semester (required, 1-8)
- Program (required, dynamic based on selected faculty)
- Content type: lecture notes, assignment, timetable, tutorial, project, lab work, other
- Description (optional, max 500 characters)
- Tutorial link (optional external URL, e.g. YouTube or Google Drive)
- File upload: PDF, PPTX, DOCX, JPEG, PNG. Max 50MB. File type and size are validated before upload.

Files are stored in the configured storage backend (local disk, S3, or MinIO). Metadata goes to the Content table in Postgres.

### 6.6 Content management (lecturer)

Lecturers see all their uploaded content in a searchable, filterable list. They can:

- Filter by status (active, draft, archived)
- Search by title
- Edit metadata (title, module, description, tutorial link)
- Change status (activate, archive, soft-delete)
- View version history of edits

### 6.7 Lecturer analytics

- Total views, downloads, and uploaded materials count
- Most-viewed content list
- Recent downloads list
- Per-item stats table with views, downloads, and average rating
- Charts: content type breakdown (pie), engagement over time (line)

### 6.8 Admin dashboard

Platform-wide numbers: total users (broken down by role), total content items, total AI interactions. Below that: recent registrations, recent AI queries, and system status.

Quick links to: user management, analytics, university settings, bulk messaging, flagged content review.

### 6.9 User management (admin)

- Paginated user list with role, faculty, email, and registration date
- Search by name or email
- Filter by role
- Actions: change role, deactivate account, delete account (with data purge), send message
- User detail view showing profile, activity summary, and flag history

### 6.10 University settings (admin)

This is new and required for standalone deployments. Admins configure:

- University name, logo, and color scheme
- Faculty list (add, edit, remove)
- Programs per faculty (add, edit, remove)
- Semester structure (number of semesters, naming convention)
- Student ID validation rules (prefix, length, regex pattern)
- Lecturer access codes (create new, view active, revoke)
- Payment provider configuration (Monime, Stripe, or disabled)
- AI provider configuration (Gemini API key, model selection, rate limits)
- Email SMTP settings
- Terms of service and privacy policy text (editable)

All of this is stored in the database, not hardcoded. A fresh deployment starts with the setup wizard, which walks through these settings.

### 6.11 Token purchase (student)

- Current balance display (available, used, total)
- Currency toggle (configurable per deployment, e.g., SLE/USD)
- Token packages: 10, 25, 50, 100 (pricing set by admin)
- Purchase flow:
  1. Select package and enter phone number (for mobile money) or card details
  2. Backend creates payment order via the configured provider
  3. For mobile money: student receives USSD prompt on their phone
  4. Webhook confirms payment and credits tokens
- Order history with status tracking
- Receipt generation (downloadable)

### 6.12 Referral program

- Each user gets a unique referral code
- Shareable via WhatsApp, SMS, or copy-to-clipboard
- When a referred user registers, both users earn bonus tokens (amount configurable by admin)
- Referral history shows who was referred, when, and tokens earned

### 6.13 Progress tracking

- Quiz score history with color-coded performance badges (green >= 70%, yellow >= 50%, red < 50%)
- Average score across all quizzes
- Learning goals: students create personal academic goals with title, description, target date, and status (active, completed, paused)
- Progress bar per goal
- Grade tracker: students can record official marks per module (self-reported, not integrated with any SIS)

### 6.14 Discussion forums

Per-module discussion boards where students can:
- Post questions or topics
- Reply to posts (threaded)
- Upvote helpful answers
- Mark a reply as "accepted answer" (original poster only)
- Report inappropriate posts (escalated to admin review queue)

Lecturers can pin announcements and respond to questions in their modules. This replaces the informal WhatsApp group dynamic with something searchable and persistent.

### 6.15 Messaging

- Compose: select recipient by name (autocomplete), subject, message body
- Inbox with unread indicators
- Sent messages view
- Reply and mark-as-read
- Block user option (blocked users cannot send you messages)
- Report message (for harassment, escalated to admin)
- Email notification for new messages (configurable per user)

### 6.16 Notifications

- In-app notification bell with unread count
- Notification types: new content in your faculty, message received, task deadline approaching, referral bonus earned, content flagged (lecturer), report resolved (admin)
- Push notifications via web push API (opt-in)
- Email digest option (daily or weekly summary, configurable)

### 6.17 Settings

- Profile photo: upload or generate avatar
- Display name
- Academic info (students): faculty, semester, program
- Notification preferences (in-app, push, email, for each notification type)
- Language preference (English by default, extensible)
- Account info: email, role, member since
- Data export: download all your data as JSON (profile, tasks, messages, quiz scores, AI history, learning goals)
- Account deletion: permanently delete account and all associated data, with a confirmation step and 7-day grace period

---

## 7. Data model

### Core tables

**User** -- id, full_name, email, password_hash, role (student/lecturer/admin), faculty_id, semester, program_id, student_id, avatar_url, terms_accepted, privacy_accepted, referral_code, free_queries_remaining, free_queries_reset_at, is_active, is_suspended, suspended_reason, created_at, updated_at, deleted_at

**University** -- id, name, slug, logo_url, primary_color, secondary_color, domain, student_id_pattern, max_semesters, created_at

**Faculty** -- id, university_id, name, code, is_active, created_at

**Program** -- id, faculty_id, name, code, is_active, created_at

**Content** -- id, title, description, file_url, file_type, file_size, faculty_id, semester, program_id, module, module_code, content_type, lecturer_id, view_count, download_count, average_rating, status (active/draft/archived), version, created_at, updated_at

**ContentAccess** -- id, content_id, user_id, access_type (view/download), created_at

**ContentRating** -- id, content_id, user_id, rating (1-5), feedback_text, created_at

**AIInteraction** -- id, user_id, conversation_id, query, response, source_content_ids, query_type, learning_level, satisfaction_rating, response_time_ms, tokens_used, created_at

**Message** -- id, sender_id, recipient_id, subject, body, is_read, created_at

**UserBlock** -- id, blocker_id, blocked_id, created_at

**Task** -- id, user_id, title, description, deadline, priority (high/medium/low), status (pending/completed), tags, created_at

**TaskInvitation** -- id, task_id, inviter_id, invitee_email, status (pending/accepted/declined), created_at

**Schedule** -- id, user_id, day_of_week, start_time, end_time, subject, location, type, created_at

**TokenBalance** -- id, user_id, available, used, total, bonus, created_at, updated_at

**TokenTransaction** -- id, user_id, amount, type (purchase/usage/bonus/refund), payment_provider, payment_reference, status, created_at

**Referral** -- id, referrer_id, referee_id, tokens_awarded, status, created_at

**QuizScore** -- id, user_id, module, quiz_type, score, total_questions, created_at

**LearningGoal** -- id, user_id, title, description, target_date, status (active/completed/paused), progress_percent, created_at, updated_at

**ForumPost** -- id, module, faculty_id, author_id, title, body, is_pinned, parent_id (null for top-level, post_id for replies), upvote_count, is_accepted_answer, created_at, updated_at

**ForumVote** -- id, post_id, user_id, created_at

**ContentFlag** -- id, content_id, reporter_id, reason, status (pending/reviewed/resolved), admin_notes, reviewed_by, created_at, resolved_at

**UserReport** -- id, reported_user_id, reporter_id, reason, context (message_id or post_id), status (pending/reviewed/resolved), admin_notes, action_taken, reviewed_by, created_at, resolved_at

**Notification** -- id, user_id, type, title, body, is_read, reference_type, reference_id, created_at

**LecturerCode** -- id, code, faculty_id, lecturer_name, is_active, created_by, created_at, revoked_at

**AuditLog** -- id, user_id, action, entity_type, entity_id, metadata (JSON), ip_address, created_at

### Notes on the schema

- Soft deletes (deleted_at) on User and Content. Hard deletes happen after the 7-day grace period or on admin action.
- University, Faculty, and Program tables replace all hardcoded lists from v1. Admins manage these through the settings UI.
- AuditLog tracks admin actions (role changes, account deletions, content removals) for accountability.
- All timestamps are UTC. The client converts to the user's timezone.

---

## 8. API routes

All API routes live under /api in the Next.js app. Authentication is enforced via NextAuth middleware. Role-based access is checked per route.

### Auth
- POST /api/auth/[...nextauth] -- NextAuth handlers (login, register, OAuth callbacks)
- POST /api/auth/register -- custom registration with role setup
- POST /api/auth/verify-email -- email verification
- POST /api/auth/validate-student-id -- validates student ID against university rules
- POST /api/auth/validate-lecturer-code -- validates lecturer access code
- POST /api/auth/validate-admin-code -- validates admin access code

### Content
- GET /api/content -- list content (filtered by faculty/semester/program for students)
- GET /api/content/:id -- single content item
- POST /api/content -- create (lecturer only)
- PATCH /api/content/:id -- update metadata (lecturer, own content only)
- DELETE /api/content/:id -- soft-delete (lecturer own, or admin)
- POST /api/content/:id/access -- log view/download
- POST /api/content/:id/rate -- submit rating
- POST /api/content/:id/flag -- flag content (any authenticated user)

### AI
- POST /api/ai/query -- send query to Gemini with source context
- POST /api/ai/learning-tool -- generate learning tool output (quiz, study guide, etc.)
- POST /api/ai/audio -- generate audio overview script
- GET /api/ai/history -- list past interactions
- DELETE /api/ai/history/:id -- delete single interaction
- DELETE /api/ai/history -- clear all history

### Users
- GET /api/users/me -- current user profile
- PATCH /api/users/me -- update profile
- DELETE /api/users/me -- request account deletion (starts 7-day grace period)
- GET /api/users/me/export -- export all user data as JSON
- POST /api/users/me/avatar -- upload avatar

### Messages
- GET /api/messages -- inbox
- GET /api/messages/sent -- sent messages
- POST /api/messages -- send message
- PATCH /api/messages/:id/read -- mark as read
- POST /api/users/:id/block -- block user
- POST /api/messages/:id/report -- report message

### Tasks
- GET /api/tasks -- list tasks
- POST /api/tasks -- create task
- PATCH /api/tasks/:id -- update task
- DELETE /api/tasks/:id -- delete task
- POST /api/tasks/:id/invite -- invite collaborator

### Forum
- GET /api/forum/:module -- list posts for a module
- POST /api/forum -- create post or reply
- POST /api/forum/:id/vote -- upvote
- PATCH /api/forum/:id/accept -- mark as accepted answer
- POST /api/forum/:id/report -- report post

### Admin
- GET /api/admin/users -- paginated user list
- PATCH /api/admin/users/:id -- change role, suspend, or delete
- GET /api/admin/analytics -- platform-wide stats
- GET /api/admin/flags -- content flags queue
- PATCH /api/admin/flags/:id -- resolve flag
- GET /api/admin/reports -- user reports queue
- PATCH /api/admin/reports/:id -- resolve report
- POST /api/admin/messages/bulk -- send bulk message
- GET /api/admin/settings -- get university settings
- PATCH /api/admin/settings -- update university settings
- POST /api/admin/lecturer-codes -- create lecturer code
- DELETE /api/admin/lecturer-codes/:id -- revoke code
- GET /api/admin/audit-log -- view audit trail
- GET /api/admin/export -- export platform data

### Tokens
- GET /api/tokens/balance -- current balance
- POST /api/tokens/purchase -- create payment order
- POST /api/tokens/webhook/:provider -- payment confirmation webhook
- POST /api/tokens/deduct -- deduct token (called internally by AI routes)
- GET /api/tokens/transactions -- transaction history

### Referrals
- GET /api/referrals -- referral history
- POST /api/referrals/process -- process new referral on registration

### Notifications
- GET /api/notifications -- list notifications
- PATCH /api/notifications/:id/read -- mark as read
- PATCH /api/notifications/read-all -- mark all as read

---

## 9. Integrations

| Service | Purpose | Open alternative |
|---------|---------|-----------------|
| Google Gemini | AI study assistant | Ollama (self-hosted LLM) |
| NextAuth.js | Authentication | N/A (already open-source) |
| Prisma + PostgreSQL | Database | N/A (already open-source) |
| ElevenLabs | Premium text-to-speech | Web Speech API (built into browsers) |
| Monime | Mobile money payments (Sierra Leone) | Configurable; Stripe, Flutterwave, or disable payments entirely |
| Nodemailer | Email delivery | Any SMTP server, including self-hosted (Postfix, etc.) |
| MinIO | S3-compatible file storage (self-hosted) | Local disk storage also supported |
| Redis | Server-side caching (optional) | In-memory LRU cache fallback |
| TanStack Query | Client-side data fetching and caching | N/A (already open-source) |
| Web Push API | Push notifications | N/A (web standard) |

Every paid or proprietary service has a documented open-source replacement. The platform runs entirely on free, open-source infrastructure if needed.

---

## 10. Security

### Access control

- Role-based middleware: every API route checks the user's role before executing
- Content isolation: student content queries are scoped to their faculty + semester at the database level (Prisma where clause), not just the UI
- Data scoping: students only see their own AI history, tasks, messages, and scores
- Admin actions are logged to AuditLog with the admin's user ID, the action taken, and a timestamp

### Authentication security

- Passwords hashed with bcrypt (cost factor 12)
- Email verification required before first login
- Session tokens are httpOnly, secure, sameSite cookies
- CSRF protection via NextAuth's built-in CSRF token
- Rate limiting on login attempts (5 per minute per IP)
- Lecturer and admin access codes are stored hashed in the database, not as plaintext strings

### Input validation

- All API inputs validated with Zod schemas
- File uploads validated for type (MIME check, not just extension) and size
- SQL injection prevented by Prisma's parameterized queries
- XSS prevented by React's default output escaping plus Content-Security-Policy headers

### Infrastructure

- HTTPS required in production (enforced by middleware)
- Environment variables for all secrets (no secrets in code)
- Database connections via connection pooling (PgBouncer recommended for production)
- File uploads stored outside the web root

---

## 11. Privacy and data handling

This section exists because the DPG Standard requires it, but also because students in developing countries deserve the same data protections as anyone else.

### What data we collect

| Data type | Why we collect it | How long we keep it |
|-----------|------------------|-------------------|
| Name, email | Account identity and communication | Until account deletion + 7-day grace period |
| Student ID | Academic program validation | Until account deletion |
| Faculty, semester, program | Content filtering | Until account deletion |
| Phone number | Mobile money payments only | Stored only on payment provider's side; we keep a masked version for transaction records |
| AI queries and responses | Chat history feature | Until user deletes them, or account deletion |
| Quiz scores | Progress tracking | Until account deletion |
| Content access logs | Analytics for lecturers | Anonymized after 12 months |
| IP addresses | Audit logging for security | Deleted after 90 days |

### Data minimization

We collect what the platform needs to function. We don't collect location data, device fingerprints, browsing history outside the app, or social graph data. The referral system stores only the relationship between referrer and referee, not how the link was shared.

### Consent

- Registration requires explicit acceptance of both the terms of service and the privacy policy (separate checkboxes, not bundled)
- The privacy policy is written in plain language, not legalese
- AI interaction logging is explained during onboarding: "Your conversations with the AI assistant are saved so you can review them later. You can delete them anytime."
- Push notifications and email digests are opt-in, not opt-out

### Data access and portability

- Students can view all data the platform holds about them from Settings > My Data
- Full data export in JSON format, downloadable as a .zip file (includes profile, tasks, messages, quiz scores, AI history, learning goals, and schedule)
- CSV export option for tabular data (quiz scores, content access history)

### Account deletion

- Students can delete their account from Settings > Delete Account
- Deletion triggers a 7-day grace period (in case of accidental deletion)
- After 7 days, all PII is permanently purged: profile data, messages (from sender side), AI history, quiz scores, learning goals, tasks
- Content access logs are anonymized (user_id replaced with a hash)
- Content uploaded by lecturers is not deleted when the lecturer's account is deleted (it belongs to the university); ownership is reassigned to the admin

### Third-party data sharing

We don't sell data. We don't share data with advertisers. The only third-party data flows are:

- AI queries are sent to Google Gemini (or the configured AI provider). We don't send student names or IDs with queries, only the question text and selected source content.
- Payment data (phone number, amount) is sent to the payment provider (Monime/Stripe). We don't store full payment credentials.
- Email addresses are sent to the configured SMTP provider for delivery.

Each of these flows is documented in the privacy policy with the specific data sent and why.

---

## 12. Content moderation

### Policies

The platform includes a content policy (editable by admins) that prohibits:

- Copyrighted material uploaded without permission
- Sexually explicit content
- Child sexual abuse material (CSAM) -- zero tolerance, immediate removal and report to authorities
- Hate speech, discrimination, or incitement to violence
- Spam or commercial advertising disguised as course materials
- AI-generated content submitted as original student work (in contexts where this is prohibited by the university)

### Detection and enforcement

- Automated: uploaded files are scanned for known CSAM hashes using PhotoDNA or similar hash-matching (configurable). File names and content descriptions are checked against a keyword blocklist.
- Manual: any authenticated user can flag content with a reason. Flags go to the admin review queue.
- Admin review: admins see flagged content, the reporter's reason, and the content itself. They can approve (dismiss flag), remove content, warn the uploader, or suspend the uploader's account.
- All moderation actions are logged to AuditLog.
- Repeat offenders: three content removals trigger automatic account suspension pending admin review.

### AI-generated content

AI responses are not moderated in real-time (that would break the chat experience), but:

- The AI system prompt includes instructions to refuse inappropriate requests
- AI interactions are logged and can be audited
- Students can report AI responses they find harmful or incorrect
- Admin analytics show AI query patterns that may indicate misuse

---

## 13. Harassment protection

### For all users

- Block function: any user can block another user. Blocked users cannot send messages, invite to tasks, or interact in forums.
- Report function: users can report messages or forum posts with a reason (harassment, spam, inappropriate content, threats). Reports go to the admin queue.
- Admin response: admins review reports and can warn, suspend (with reason visible to the user), or permanently ban the reported user.
- Appeal process: suspended users can reply to their suspension notification to request review.

### For underage users

- Registration requires date of birth (not displayed publicly, used only for age verification)
- Users under 18 get restricted messaging: they can only message users within their own faculty, and only about academic topics (enforced by UI constraints, not content scanning)
- Users under 13 are not permitted to register (blocked at registration)
- The privacy policy includes a specific section on minor user protections

### Code of conduct

The platform ships with a default code of conduct (editable by admins) that covers:

- Expected behavior (respect, academic integrity, constructive discussion)
- Prohibited behavior (harassment, discrimination, doxxing, threats)
- Reporting process (how to report, what happens after a report)
- Consequences (warning, suspension, permanent ban)

The code of conduct is linked from registration, the forum, and the messaging interface.

---

## 14. Accessibility

The platform follows WCAG 2.1 Level AA guidelines:

- Color contrast: all text meets 4.5:1 contrast ratio against the background (verified for both dark and light themes)
- Keyboard navigation: every interactive element is reachable and operable via keyboard
- Screen reader support: semantic HTML, ARIA labels on non-text elements, form labels, and status announcements
- Focus management: visible focus indicators, logical tab order, focus trapped in modals
- Responsive design: works on screens from 320px width up
- Text scaling: UI doesn't break at 200% browser zoom
- Alt text: all images (including avatars and file type icons) have descriptive alt text
- Error messages: form validation errors are announced to screen readers and associated with their fields
- Reduced motion: animations respect the prefers-reduced-motion media query
- Light/dark theme toggle (dark is default but light is available)

---

## 15. Deployment

### Self-hosted (recommended for DPG)

Prerequisites: a Linux server with Docker and Docker Compose installed. 2GB RAM minimum, 4GB recommended.

```
git clone https://github.com/uninotepad/uninotepad.git
cd uninotepad
cp .env.example .env
# Edit .env with your database URL, Gemini API key, SMTP settings, etc.
docker-compose up -d
```

The docker-compose file includes: the Next.js app, PostgreSQL, MinIO (file storage), and Redis (optional caching). First run triggers database migrations automatically.

After startup, visit your domain and complete the setup wizard: university name, admin account, faculty/program structure, branding.

### Hosted (multi-tenant)

Universities sign up at uninotepad.org. They get:
- A subdomain namespace (e.g., makerere.uninotepad.org)
- Isolated database schema
- The same setup wizard
- Managed updates and backups

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| NEXTAUTH_SECRET | Yes | Session encryption key |
| NEXTAUTH_URL | Yes | Base URL of the deployment |
| GEMINI_API_KEY | Yes | Google Gemini API key |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS | Yes | Email delivery |
| S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY | No | File storage (defaults to local disk) |
| ELEVENLABS_API_KEY | No | Premium TTS (falls back to Web Speech API) |
| MONIME_API_KEY | No | Mobile money payments |
| STRIPE_SECRET_KEY | No | Card payments |
| REDIS_URL | No | Server-side caching |

---

## 16. Open-source and licensing

### License

The entire codebase is released under the MIT License. This means any person or institution can use, copy, modify, merge, publish, distribute, sublicense, or sell copies of the software without restriction.

### Repository structure

```
uninotepad/
  src/
    app/              # Next.js App Router pages and layouts
      (student)/      # Student subdomain pages
      (lecturer)/     # Lecturer subdomain pages
      (admin)/        # Admin subdomain pages
      (public)/       # Landing page and auth pages
      api/            # API routes
    components/       # Shared React components
    lib/              # Utilities, AI helpers, payment adapters
    prisma/           # Schema and migrations
  docker-compose.yml
  Dockerfile
  .env.example
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  LICENSE
  README.md
```

### Contributing

CONTRIBUTING.md covers:
- How to set up a local development environment
- Code style (ESLint + Prettier config included)
- How to submit a pull request
- How to report bugs
- How to request features
- Code review process

### Documentation

- README.md: quick start, architecture overview, deployment guide
- /docs folder: detailed guides for self-hosting, configuration, API reference, and extending the platform
- Inline code comments where the logic isn't obvious (not everywhere)
- OpenAPI spec generated from the API routes for third-party integrations

---

## 17. DPG Standard compliance summary

| Indicator | How we meet it |
|-----------|---------------|
| 1. SDG relevance | Targets SDG 4.3 (affordable higher education access), 4.4 (employment skills), 4.a (learning environments). Deployed and in use at a university in Sierra Leone. |
| 2. Open license | MIT License. Full source code on GitHub. |
| 3. Clear ownership | Copyright held by Alhassan Ojoe Koroma. Copyright notice in LICENSE file. Author field in package.json. |
| 4. Platform independence | Every proprietary dependency has a documented open-source alternative. The platform runs entirely on free, open-source infrastructure (Postgres, Ollama, MinIO, Nodemailer). |
| 5. Documentation | README, /docs folder, CONTRIBUTING.md, OpenAPI spec, inline comments. Setup wizard guides non-technical admins through configuration. |
| 6. Non-PII data extraction | JSON and CSV data export for all users. Admin can export anonymized platform-wide data. All exports use open formats. |
| 7. Privacy and applicable laws | Privacy policy with plain-language data inventory. Data minimization, explicit consent, defined retention periods, account deletion with data purge. See Section 11. |
| 8. Standards and best practices | WCAG 2.1 AA accessibility. OWASP security practices. Prisma for SQL injection prevention. Input validation with Zod. CSP headers. |
| 9a. Data privacy/security | Bcrypt password hashing, encrypted sessions, role-based access, audit logging, no plaintext secrets. See Sections 10-11. |
| 9b. Content moderation | Content policy, CSAM hash matching, user flagging, admin review queue, escalation procedures. See Section 12. |
| 9c. Harassment protection | User blocking, reporting, admin review, code of conduct, underage user restrictions. See Section 13. |

---

## 18. Faculties and programs (default for LUSL)

These are the default values loaded during the LUSL deployment setup. Other universities configure their own through the admin settings UI.

Faculty: FICT (Faculty of ICT)
  Programs: BIT, BBIT, BPC, BCS, MIT, DIT

Faculty: FCMB (Faculty of Communication and Media)
  Programs: BMC, BMMC, BPR, BJOUR, BFA, MCC

Faculty: FBMG (Faculty of Business Management)
  Programs: BBA, BBF, BHM, BHRM, MBA, BBAF

Faculty: FABE (Faculty of Architecture and Built Environment)
  Programs: BARCH, BCIVL, BINT, BQSUR, MURP

Faculty: FDI (Faculty of Design and Innovation)
  Programs: BGRD, BFASH, BINT, BPROD, BPHOT

Faculty: FCTH (Faculty of Culture, Tourism and Hospitality)
  Programs: BTOUR, BHGT, BEVT, BHRM, BFNB

Student ID format: starts with "90500", minimum 9 characters.
(Configurable per university deployment.)

---

## 19. Roadmap

### Phase 1: Core rebuild (April-May 2026)
- Set up Next.js 16+ project with subdomain routing
- Implement Prisma schema and migrations
- Build NextAuth integration (email/password, Google, Facebook)
- Rebuild student dashboard, content browse, and AI assistant on new stack
- Rebuild lecturer dashboard and content management
- Rebuild admin dashboard with settings UI
- Implement data export and account deletion
- Write deployment docs and Dockerfile

### Phase 2: DPG compliance (June 2026)
- Implement content moderation system (flagging, review queue, CSAM scanning)
- Implement user reporting and blocking
- Build code of conduct and privacy policy into the platform
- WCAG 2.1 AA audit and fixes
- Publish to GitHub under MIT license
- Write CONTRIBUTING.md and developer docs
- Submit DPG application

### Phase 3: Community features (Q3 2026)
- Discussion forums
- Grade tracker
- Push notifications
- Offline mode (PWA with service worker for cached content)

### Phase 4: Multi-university (Q4 2026)
- Multi-tenant hosted infrastructure
- University onboarding portal
- Per-university branding
- International payment gateways (Stripe, Flutterwave)
- Localization framework (start with Krio for Sierra Leone)

---

## 20. Success metrics

| Metric | Target (Year 1) |
|--------|-----------------|
| Universities deployed | 3+ |
| Active students per month (across all instances) | 1,500+ |
| Course materials uploaded | 500+ |
| AI queries per student per month | 15+ |
| Average session duration | 10+ minutes |
| DPG Standard certification | Achieved |
| GitHub stars | 100+ |
| External contributors | 5+ |
| Content moderation response time | < 24 hours |
| Account deletion requests processed | < 7 days |
`;

export default function PRDPage() {
  const handleDownload = () => {
    const blob = new Blob([PRD_CONTENT], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PRD_UniNotepad_v2.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">PRD -- UniNotepad v2</h1>
              <p className="text-sm text-gray-400 mt-1">Open-source university learning platform -- DPG aligned -- March 2026</p>
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

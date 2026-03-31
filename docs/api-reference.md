# API Reference

All endpoints return JSON with this shape:

```json
{ "success": true, "data": ... }
// or
{ "success": false, "error": "message" }
```

Auth levels:
- **Public** -- no authentication required
- **Authenticated** -- any logged-in user
- **Lecturer** -- `LECTURER` role required
- **Admin** -- `ADMIN` role required

---

## Authentication

### POST `/api/auth/register`

**Auth**: Public

Register a new user account.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Min 2 characters |
| `email` | string | Yes | Valid email |
| `password` | string | Yes | Min 8 characters |
| `role` | string | Yes | `"STUDENT"`, `"LECTURER"`, or `"ADMIN"` |
| `studentId` | string | No | Required for students, validated against `studentIdPattern` |
| `accessCode` | string | No | Required for lecturers |
| `referralCode` | string | No | Awards bonus tokens to referrer |
| `facultyId` | string | No | Required for students |
| `semester` | number | No | Required for students |
| `programId` | string | No | Required for students |
| `termsAccepted` | boolean | No | |
| `privacyAccepted` | boolean | No | |

**Response (201)**: `{ success, data: { id, email, role } }`

### POST `/api/auth/verify`

**Auth**: Public

Verify email address with a token sent via email.

| Field | Type | Required |
|-------|------|----------|
| `token` | string | Yes |

**Response**: `{ success: true }`

### POST `/api/auth/forgot-password`

**Auth**: Public

Request a password reset email. Always returns success to prevent email enumeration.

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |

**Response**: `{ success: true }`

### POST `/api/auth/reset-password`

**Auth**: Public

Reset password using a token from the forgot-password email.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `token` | string | Yes | |
| `password` | string | Yes | Min 8 characters |

**Response**: `{ success: true }`

---

## Users

### GET `/api/users`

**Auth**: Authenticated

Search for users by name. Returns up to 10 results. Excludes blocked users and self.

| Query param | Type | Notes |
|-------------|------|-------|
| `search` | string | Min 2 characters |

**Response**: `{ success, data: [{ id, name, email, role, avatarUrl }] }`

### PATCH `/api/users/setup`

**Auth**: Authenticated

Set faculty, semester, and program for the current user (student onboarding).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `facultyId` | string | Yes | Must exist |
| `semester` | number | Yes | 1-12 |
| `programId` | string | Yes | Must belong to the specified faculty |
| `studentId` | string | No | Must be unique |

**Response**: `{ success: true }`

### GET `/api/users/faculties`

**Auth**: Public

Returns all active faculties, programs, max semesters, and student ID pattern. Used by the registration form.

**Response**: `{ success, data: { faculties, programs, maxSemesters, studentIdPattern } }`

### DELETE `/api/users/me`

**Auth**: Authenticated

Soft-delete the current user's account (7-day grace period).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `password` | string | Yes | Current password for confirmation |
| `reason` | string | No | Max 500 characters |

**Response**: `{ success: true }`

### POST `/api/users/me/cancel-deletion`

**Auth**: Authenticated

Cancel a pending account deletion.

**Response**: `{ success: true }`

### GET `/api/users/me/export`

**Auth**: Authenticated

Export all personal data as JSON or CSV file download.

| Query param | Type | Notes |
|-------------|------|-------|
| `format` | string | `"json"` (default) or `"csv"` |
| `type` | string | Required for CSV: `"quiz_scores"` or `"content_access"` |

**Response**: File download (JSON or CSV)

### POST `/api/users/[id]/block`

**Auth**: Authenticated

Block a user. Blocked users cannot send you messages and are hidden from search results.

**Response**: `{ success: true }`

### DELETE `/api/users/[id]/block`

**Auth**: Authenticated

Unblock a previously blocked user.

**Response**: `{ success: true }`

---

## Profile

### GET `/api/profile`

**Auth**: Authenticated

**Response**: `{ success, data: { id, name, email, image, avatarUrl, role, createdAt, deletedAt } }`

### PATCH `/api/profile`

**Auth**: Authenticated

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | No | 1-100 characters |
| `avatarUrl` | string | No | Valid URL |

**Response**: `{ success, data: { id, name, email, image, avatarUrl, role } }`

---

## Content

### GET `/api/content`

**Auth**: Authenticated

List content filtered by the student's faculty and semester.

| Query param | Type | Notes |
|-------------|------|-------|
| `search` | string | Searches title and module |
| `module` | string | Filter by module name |
| `contentType` | string | Filter by type |
| `sort` | string | `"newest"` (default), `"views"`, `"downloads"` |
| `page` | number | Default 1 |

**Response**: `{ success, data: [{ id, title, description, module, moduleCode, contentType, viewCount, downloadCount, averageRating, createdAt, faculty, lecturer }], pagination }`

### GET `/api/content/[id]`

**Auth**: Authenticated. Students can only access content matching their faculty and semester.

**Response**: `{ success, data: { ...content, faculty, program, lecturer, ratings } }`

### POST `/api/content/[id]/access`

**Auth**: Authenticated

Log a view or download. Increments the corresponding counter.

| Field | Type | Required |
|-------|------|----------|
| `accessType` | string | Yes: `"view"` or `"download"` |

**Response**: `{ success: true }`

### POST `/api/content/[id]/rate`

**Auth**: Authenticated

Rate content (one rating per user per content, upserted).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `rating` | number | Yes | 1-5 |
| `feedbackText` | string | No | |

**Response**: `{ success: true }`

### POST `/api/content/[id]/flag`

**Auth**: Authenticated

Flag content for admin review. Notifies all admins.

| Field | Type | Required |
|-------|------|----------|
| `reason` | string | Yes |

**Response (201)**: `{ success, data: { ...contentFlag } }`

---

## AI Study Assistant

### GET `/api/ai`

**Auth**: Public

Health check. Returns `{ status: "ok" }`.

### GET `/api/ai/status`

**Auth**: Authenticated

Get the current user's AI usage status.

**Response**: `{ success, data: { freeRemaining, resetAt, tokenBalance } }`

### POST `/api/ai/query`

**Auth**: Authenticated

Send a query to the AI assistant. Returns a **Server-Sent Events stream**, not JSON.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `query` | string | Yes | Min 1 character |
| `conversationId` | string | No | Continue an existing conversation |
| `sourceContentIds` | string[] | No | Content IDs to use as context |
| `learningLevel` | string | No | `"beginner"`, `"intermediate"`, `"advanced"` |
| `chatStyle` | string | No | `"default"`, `"learning_guide"`, `"custom"` |
| `responseLength` | string | No | `"default"`, `"shorter"`, `"longer"` |
| `customInstructions` | string | No | Max 500 characters |

**SSE events**:
- `{ type: "delta", text: "chunk" }` -- streamed text
- `{ type: "done", id, conversationId }` -- stream complete
- `{ type: "error", message }` -- on failure

Returns 429 if rate limit exceeded.

### POST `/api/ai/learning-tool`

**Auth**: Authenticated

Generate study materials using one of 10 learning tools.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `toolType` | string | Yes | See values below |
| `sourceContentIds` | string[] | Yes | Min 1 |
| `topic` | string | No | |
| `learningLevel` | string | No | `"beginner"`, `"intermediate"`, `"advanced"` |

Tool types: `study_guide`, `quiz_mcq`, `fill_blanks`, `matching`, `true_false`, `concept_explainer`, `study_plan`, `audio_overview`, `exam_prep`, `note_summary`. Note: `audio_overview` is rejected here -- use `/api/ai/audio` instead.

**Response**: `{ success, data: { toolType, content, structured, interactionId } }`

### POST `/api/ai/audio`

**Auth**: Authenticated

Generate an audio overview narration script with optional TTS audio.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `sourceContentIds` | string[] | Yes | Min 1 |
| `narrationStyle` | string | Yes | `"single"` or `"conversation"` |
| `voiceId` | string | No | ElevenLabs voice ID |

**Response**: `{ success, data: { script, audioBase64, interactionId } }`

`audioBase64` is null if ElevenLabs is not configured.

### POST `/api/ai/quiz-score`

**Auth**: Authenticated

Save a quiz score.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `module` | string | Yes | |
| `quizType` | string | Yes | `"mcq"`, `"true_false"`, `"fill_blanks"`, `"matching"` |
| `score` | number | Yes | Integer, min 0 |
| `totalQuestions` | number | Yes | Integer, min 1 |

**Response**: `{ success, data: { ...quizScore } }`

### GET `/api/ai/history`

**Auth**: Authenticated

List AI conversation history (page size 20).

| Query param | Type | Notes |
|-------------|------|-------|
| `page` | number | Default 1 |

**Response**: `{ success, data: [{ conversationId, title, messageCount, createdAt, updatedAt }] }`

### DELETE `/api/ai/history`

**Auth**: Authenticated

Delete all AI conversation history.

**Response**: `{ success: true }`

### GET `/api/ai/history/[id]`

**Auth**: Authenticated

Get all messages in a conversation (by `conversationId`).

**Response**: `{ success, data: [{ id, query, response, sourceContentIds, learningLevel, satisfactionRating, createdAt }] }`

### DELETE `/api/ai/history/[id]`

**Auth**: Authenticated

Delete a specific conversation.

**Response**: `{ success: true }`

### PATCH `/api/ai/history/[id]/rate`

**Auth**: Authenticated

Rate an individual AI interaction.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `rating` | number | Yes | 1-5 |

**Response**: `{ success: true }`

---

## Forum

### GET `/api/forum`

**Auth**: Authenticated

Without `module` param: returns a list of modules with post counts. With `module`: returns paginated posts.

| Query param | Type | Notes |
|-------------|------|-------|
| `module` | string | If omitted, returns module listing |
| `facultyId` | string | Defaults to user's faculty |
| `sort` | string | `"newest"` (default) or `"popular"` |
| `page` | number | Default 1 |
| `limit` | number | Default 20, max 50 |

**Response (module listing)**: `{ success, type: "module_list", data: [{ module, postCount }] }`

**Response (posts)**: `{ success, data: [{ id, module, title, body, isPinned, upvoteCount, isAcceptedAnswer, createdAt, author, hasVoted, replyCount }], pagination }`

### POST `/api/forum`

**Auth**: Authenticated

Create a new forum post or reply.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `module` | string | Yes | |
| `facultyId` | string | Yes | |
| `body` | string | Yes | 1-10,000 characters |
| `title` | string | No | 1-300 characters. Required for top-level posts. |
| `parentId` | string | No | Set to create a reply |

**Response (201)**: `{ success, data: { ...post, author } }`

### GET `/api/forum/[id]`

**Auth**: Authenticated

Get a post with all its replies. Replies are sorted: accepted answers first, then by upvotes, then by date.

**Response**: `{ success, data: { ...post, author, hasVoted, replies: [{ ...reply, author, hasVoted }] } }`

### POST `/api/forum/[id]/vote`

**Auth**: Authenticated

Toggle upvote on a post.

**Response**: `{ success, data: { voted, upvoteCount } }`

### PATCH `/api/forum/[id]/accept`

**Auth**: Authenticated (only the original question author)

Mark a reply as the accepted answer. Only one accepted answer per question.

**Response**: `{ success: true }`

### PATCH `/api/forum/[id]/pin`

**Auth**: Lecturer or Admin (lecturers limited to own faculty)

Toggle pin on a top-level post.

**Response**: `{ success, data: { id, isPinned } }`

### POST `/api/forum/[id]/report`

**Auth**: Authenticated (cannot report own posts)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `reason` | string | Yes | 1-500 characters |

**Response (201)**: `{ success: true }`

---

## Messages

### GET `/api/messages`

**Auth**: Authenticated

Inbox (excludes messages from users who blocked you).

| Query param | Type | Notes |
|-------------|------|-------|
| `page` | number | Default 1, page size 20 |

**Response**: `{ success, data: [{ ...message, sender: { id, name, avatarUrl } }], pagination }`

### POST `/api/messages`

**Auth**: Authenticated

Send a direct message. Blocked users cannot message each other.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `recipientId` | string | Yes | |
| `subject` | string | Yes | 1-200 characters |
| `body` | string | Yes | 1-5,000 characters |

**Response (201)**: `{ success, data: { ...message } }`

### GET `/api/messages/sent`

**Auth**: Authenticated

| Query param | Type | Notes |
|-------------|------|-------|
| `page` | number | Default 1, page size 20 |

**Response**: `{ success, data: [{ ...message, recipient: { id, name, avatarUrl } }], pagination }`

### PATCH `/api/messages/[id]/read`

**Auth**: Authenticated (must be the recipient)

Mark a message as read.

**Response**: `{ success: true }`

### POST `/api/messages/[id]/report`

**Auth**: Authenticated

Report a message.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `reason` | string | Yes | 1-500 characters |

**Response (201)**: `{ success, data: { ...userReport } }`

---

## Tasks

### GET `/api/tasks`

**Auth**: Authenticated

List the current user's tasks.

| Query param | Type | Notes |
|-------------|------|-------|
| `status` | string | Filter by status |
| `priority` | string | Filter by priority |

**Response**: `{ success, data: [{ ...task, invitations }] }`

### POST `/api/tasks`

**Auth**: Authenticated

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | 1-200 characters |
| `description` | string | No | Max 1,000 characters |
| `deadline` | date | No | |
| `priority` | string | No | `"HIGH"`, `"MEDIUM"` (default), `"LOW"` |
| `tags` | string[] | No | Max 10, each max 50 characters |

**Response (201)**: `{ success, data: { ...task, invitations } }`

### PATCH `/api/tasks/[id]`

**Auth**: Authenticated (task owner only)

All fields from POST are optional, plus:

| Field | Type | Notes |
|-------|------|-------|
| `status` | string | `"PENDING"` or `"COMPLETED"` |

**Response**: `{ success, data: { ...task, invitations } }`

### DELETE `/api/tasks/[id]`

**Auth**: Authenticated (task owner only)

Hard delete.

**Response**: `{ success: true }`

### POST `/api/tasks/[id]/invite`

**Auth**: Authenticated (task owner only)

| Field | Type | Required |
|-------|------|----------|
| `inviteeEmail` | string | Yes (valid email) |

**Response (201)**: `{ success, data: { ...invitation } }`

Returns 409 if already invited.

---

## Schedule

### GET `/api/schedule`

**Auth**: Authenticated

Returns all schedule entries for the user, ordered by day then start time.

**Response**: `{ success, data: [{ ...schedule }] }`

### POST `/api/schedule`

**Auth**: Authenticated

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `dayOfWeek` | number | Yes | 0 (Sunday) to 6 (Saturday) |
| `startTime` | string | Yes | `"HH:mm"` format |
| `endTime` | string | Yes | `"HH:mm"` format |
| `subject` | string | Yes | 1-200 characters |
| `location` | string | No | Max 200 characters |
| `type` | string | No | `"lecture"`, `"tutorial"`, `"lab"` |

**Response (201)**: `{ success, data: { ...schedule } }`

### PATCH `/api/schedule/[id]`

**Auth**: Authenticated (entry owner only)

All fields from POST are optional.

**Response**: `{ success, data: { ...schedule } }`

### DELETE `/api/schedule/[id]`

**Auth**: Authenticated (entry owner only)

**Response**: `{ success: true }`

---

## Notifications

### GET `/api/notifications`

**Auth**: Authenticated

| Query param | Type | Notes |
|-------------|------|-------|
| `pageSize` | number | Default 20, max 50 |
| `unread` | string | `"true"` to filter unread only |

**Response**: `{ success, data: [{ ...notification }], unreadCount }`

### PATCH `/api/notifications/[id]/read`

**Auth**: Authenticated (notification owner only)

**Response**: `{ success: true }`

### PATCH `/api/notifications/read-all`

**Auth**: Authenticated

Mark all notifications as read.

**Response**: `{ success: true }`

---

## Search

### GET `/api/search`

**Auth**: Authenticated

Global search across content, tasks, schedule, messages, and forum. Returns up to 5 results per category. Content and forum results are scoped to the user's faculty.

| Query param | Type | Notes |
|-------------|------|-------|
| `q` | string | Min 2 characters |

**Response**: `{ success, data: { content: [...], tasks: [...], schedule: [...], messages: [...], forum: [...] } }`

Each result: `{ id, title, subtitle, category, href }`

---

## Dashboard

### GET `/api/dashboard/stats`

**Auth**: Authenticated

**Response**: `{ success, data: { unreadMessages, upcomingDeadlines, freeQueriesRemaining } }`

`upcomingDeadlines` counts pending tasks with deadlines within 7 days.

---

## Miscellaneous

### GET `/api/settings/public`

**Auth**: Authenticated

**Response**: `{ success, data: { universityName, universityLogo, maxSemesters } }`

### GET `/api/faculties`

**Auth**: Authenticated

**Response**: `{ success, data: [{ id, name, code }] }`

### GET `/api/programs`

**Auth**: Authenticated

| Query param | Type | Required |
|-------------|------|----------|
| `facultyId` | string | Yes |

**Response**: `{ success, data: [{ id, name, code }] }`

### POST `/api/setup`

**Auth**: Public (only works before setup is completed)

Initial setup wizard. Creates admin account, faculties, programs, and app settings in a single transaction.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `universityName` | string | Yes | |
| `universityLogo` | string | No | |
| `primaryColor` | string | No | Default `"#7c3aed"` |
| `secondaryColor` | string | No | Default `"#1e1e1e"` |
| `adminName` | string | Yes | |
| `adminEmail` | string | Yes | Valid email |
| `adminPassword` | string | Yes | Min 8 characters |
| `faculties` | array | Yes | Min 1. Each: `{ name, code, programs?: [{ name, code }] }` |
| `studentIdPattern` | string | No | Regex, default `"^90500\\d{4,}$"` |
| `geminiApiKey` | string | Yes | |
| `resendApiKey` | string | Yes | |
| `cloudinaryCloudName` | string | Yes | |
| `cloudinaryApiKey` | string | Yes | |
| `cloudinaryApiSecret` | string | Yes | |
| `elevenlabsApiKey` | string | No | |
| `monimeApiKey` | string | No | |
| `stripeSecretKey` | string | No | |
| `termsOfService` | string | No | |
| `privacyPolicy` | string | No | |
| `codeOfConduct` | string | No | |

**Response**: `{ success: true }`

### GET `/api/tokens`

**Auth**: None (stub)

Placeholder. Returns `{ status: "ok" }`.

### GET `/api/referrals`

**Auth**: None (stub)

Placeholder. Returns `{ status: "ok" }`.

---

## Lecturer

### GET `/api/lecturer/content`

**Auth**: Lecturer

List the lecturer's own content.

| Query param | Type | Notes |
|-------------|------|-------|
| `status` | string | Filter by status. `"ALL"` returns everything. |
| `search` | string | Searches title and module |
| `page` | number | Default 1 |
| `limit` | number | Default 20, max 50 |

**Response**: `{ success, data: [{ ...content, faculty, program }], pagination }`

### POST `/api/lecturer/content`

**Auth**: Lecturer

Upload new content. Send as `multipart/form-data`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | Yes | PDF, PPTX, DOCX, JPEG, PNG. Max 50MB. |
| `title` | string | Yes | |
| `description` | string | No | |
| `facultyId` | string | Yes | |
| `semester` | number | Yes | Min 1 |
| `programId` | string | No | |
| `module` | string | Yes | |
| `moduleCode` | string | No | |
| `contentType` | string | Yes | `LECTURE_NOTES`, `ASSIGNMENT`, `TIMETABLE`, `TUTORIAL`, `PROJECT`, `LAB`, `OTHER` |
| `tutorialLink` | string | No | Valid URL |

**Response (201)**: `{ success, data: { ...content } }`

Notifies all students in the matching faculty and semester.

### PATCH `/api/lecturer/content/[id]`

**Auth**: Lecturer (must own the content)

All fields from POST are optional, plus:

| Field | Type | Notes |
|-------|------|-------|
| `status` | string | `"ACTIVE"`, `"DRAFT"`, `"ARCHIVED"` |

Increments `version` on each update.

**Response**: `{ success, data: { ...content } }`

### DELETE `/api/lecturer/content/[id]`

**Auth**: Lecturer (must own the content)

Soft delete (sets status to `"ARCHIVED"`).

**Response**: `{ success: true }`

### GET `/api/lecturer/stats`

**Auth**: Lecturer

**Response**:
```json
{
  "success": true,
  "data": {
    "totalContent": 0,
    "totalViews": 0,
    "totalDownloads": 0,
    "averageRating": null,
    "recentContent": [{ "id", "title", "module", "contentType", "viewCount", "downloadCount", "createdAt" }]
  }
}
```

### GET `/api/lecturer/analytics`

**Auth**: Lecturer

**Response**:
```json
{
  "success": true,
  "data": {
    "totalContent": 0,
    "totalViews": 0,
    "totalDownloads": 0,
    "topContent": [],
    "recentDownloads": [],
    "allContent": [],
    "typeBreakdown": [],
    "viewsOverTime": []
  }
}
```

`topContent`: top 10 by views. `viewsOverTime`: last 12 weeks grouped by Monday.

---

## Webhooks

### GET `/api/webhooks/monime`

**Auth**: Public (stub)

Placeholder. Returns `{ status: "ok" }`.

### GET `/api/webhooks/stripe`

**Auth**: Public (stub)

Placeholder. Returns `{ status: "ok" }`.

---

## Admin

All admin endpoints (except the health check) require the `ADMIN` role. Write operations are audit-logged.

### GET `/api/admin`

**Auth**: None

Health check. Returns `{ status: "ok" }`.

### GET `/api/admin/dashboard`

**Auth**: Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalStudents": 0, "totalLecturers": 0, "totalAdmins": 0,
      "totalUsers": 0, "totalContent": 0, "totalAiInteractions": 0
    },
    "recentRegistrations": [{ "id", "name", "email", "role", "createdAt" }],
    "recentAiQueries": [{ "id", "queryType", "createdAt", "user": { "name", "email" } }]
  }
}
```

### GET `/api/admin/analytics`

**Auth**: Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "stats": { "totalUsers": 0, "totalContent": 0, "totalAiInteractions": 0 },
    "usersByRole": [{ "role", "count" }],
    "contentByType": [{ "type", "count" }],
    "signupTrend": [{ "date", "count" }],
    "aiUsageTrend": [{ "date", "count" }]
  }
}
```

Trends cover the last 30 days.

### GET `/api/admin/users`

**Auth**: Admin

| Query param | Type | Notes |
|-------------|------|-------|
| `page` | number | Default 1 |
| `limit` | number | Default 20, max 50 |
| `search` | string | Name or email substring |
| `role` | string | `"STUDENT"`, `"LECTURER"`, `"ADMIN"` |

**Response**: `{ success, data: [{ id, name, email, role, image, isSuspended, isActive, createdAt, faculty }], pagination }`

### GET `/api/admin/users/[id]`

**Auth**: Admin

**Response**: `{ success, data: { id, name, email, role, image, isSuspended, suspendedReason, isActive, studentId, createdAt, faculty, program, _count: { content, aiInteractions } } }`

### PATCH `/api/admin/users/[id]`

**Auth**: Admin

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `role` | string | No | `"STUDENT"`, `"LECTURER"`, `"ADMIN"` |
| `isSuspended` | boolean | No | |
| `suspendedReason` | string | No | |
| `isActive` | boolean | No | |

**Response**: `{ success, data: { ...user } }`

### DELETE `/api/admin/users/[id]`

**Auth**: Admin

Soft delete (sets `deletedAt`). Cannot delete own account.

**Response**: `{ success: true }`

### GET `/api/admin/faculties`

**Auth**: Admin

Returns all faculties with their programs included.

**Response**: `{ success, data: [{ ...faculty, programs }] }`

### POST `/api/admin/faculties`

**Auth**: Admin

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `code` | string | Yes |

**Response (201)**: `{ success, data: { ...faculty } }`

### PATCH `/api/admin/faculties/[id]`

**Auth**: Admin

| Field | Type | Required |
|-------|------|----------|
| `name` | string | No |
| `code` | string | No |

**Response**: `{ success, data: { ...faculty } }`

### DELETE `/api/admin/faculties/[id]`

**Auth**: Admin

Soft deactivation (sets `isActive: false`).

**Response**: `{ success, data: { ...faculty } }`

### POST `/api/admin/programs`

**Auth**: Admin

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `code` | string | Yes |
| `facultyId` | string | Yes |

**Response (201)**: `{ success, data: { ...program } }`

### PATCH `/api/admin/programs/[id]`

**Auth**: Admin

| Field | Type | Required |
|-------|------|----------|
| `name` | string | No |
| `code` | string | No |
| `facultyId` | string | No |

**Response**: `{ success, data: { ...program } }`

### DELETE `/api/admin/programs/[id]`

**Auth**: Admin

Soft deactivation (sets `isActive: false`).

**Response**: `{ success, data: { ...program } }`

### GET `/api/admin/lecturer-codes`

**Auth**: Admin

List all lecturer registration codes.

**Response**: `{ success, data: [{ ...code, faculty }] }`

### POST `/api/admin/lecturer-codes`

**Auth**: Admin

Generate a new lecturer registration code. The plaintext code is returned only once.

| Field | Type | Required |
|-------|------|----------|
| `lecturerName` | string | Yes |
| `facultyId` | string | No |

**Response (201)**: `{ success, data: { ...code, plainCode } }`

### DELETE `/api/admin/lecturer-codes/[id]`

**Auth**: Admin

Revoke a code (sets `isActive: false`).

**Response**: `{ success: true }`

### GET `/api/admin/flags`

**Auth**: Admin

| Query param | Type | Notes |
|-------------|------|-------|
| `status` | string | `"PENDING"`, `"REVIEWED"`, `"RESOLVED"` |

**Response**: `{ success, data: [{ ...flag, content, reporter, reviewer }] }`

### PATCH `/api/admin/flags/[id]`

**Auth**: Admin

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `status` | string | Yes | `"PENDING"`, `"REVIEWED"`, `"RESOLVED"` |
| `adminNotes` | string | No | |
| `action` | string | No | `"DISMISS"`, `"REMOVE_CONTENT"`, `"WARN_UPLOADER"`, `"SUSPEND_UPLOADER"` |

Actions: `REMOVE_CONTENT` archives the content. `WARN_UPLOADER` sends a notification. `SUSPEND_UPLOADER` suspends the lecturer.

**Response**: `{ success, data: { ...flag } }`

### GET `/api/admin/reports`

**Auth**: Admin

| Query param | Type | Notes |
|-------------|------|-------|
| `status` | string | `"PENDING"`, `"REVIEWED"`, `"RESOLVED"` |

**Response**: `{ success, data: [{ ...report, reportedUser, reporter, reviewer }] }`

### PATCH `/api/admin/reports/[id]`

**Auth**: Admin

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `status` | string | Yes | `"PENDING"`, `"REVIEWED"`, `"RESOLVED"` |
| `adminNotes` | string | No | |
| `actionTaken` | string | No | `"DISMISS"`, `"WARN"`, `"SUSPEND"`, `"BAN"` |

Actions: `WARN` sends a notification. `SUSPEND` suspends the user. `BAN` deactivates and suspends permanently.

**Response**: `{ success, data: { ...report } }`

### GET `/api/admin/settings`

**Auth**: Admin

Returns app settings with API keys masked (showing only last 4 characters).

**Response**: `{ success, data: { ...appSettings } }`

### PATCH `/api/admin/settings`

**Auth**: Admin

All fields from the AppSettings model are optional. Values starting with `"****"` are ignored to prevent overwriting real keys with masked values.

**Response**: `{ success, data: { ...appSettings } }` (keys masked)

### GET `/api/admin/audit-log`

**Auth**: Admin

| Query param | Type | Notes |
|-------------|------|-------|
| `page` | number | Default 1 |
| `limit` | number | Default 20, max 50 |
| `action` | string | Substring filter |
| `entityType` | string | Exact match filter |

**Response**: `{ success, data: [{ ...auditLog, user: { name, email } }], pagination }`

### POST `/api/admin/messages/bulk`

**Auth**: Admin

Send a message to multiple users at once.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `subject` | string | Yes | |
| `body` | string | Yes | |
| `recipientFilter` | object | Yes | See below |
| `preview` | boolean | No | If true, returns count without sending |

`recipientFilter`: `{ type: "ALL" | "ROLE" | "FACULTY" | "SEMESTER", role?, facultyId?, semester? }`

**Response**: `{ success, data: { recipientCount } }`

### GET `/api/admin/export`

**Auth**: Admin

Downloads a JSON file with platform-wide statistics.

**Response**: File download (`platform-export.json`) with user stats, content stats, AI usage, and quiz data.

### POST `/api/admin/purge`

**Auth**: Admin

Permanently delete users whose soft-delete grace period (7 days) has expired.

**Response**: `{ success, data: { purgedCount } }`

# Content Management System - Complete Analysis

## Overview
UniNotepad is a university learning platform with three user roles. The content management system allows lecturers to upload course materials and students to browse, view, and rate content. This document lists all files involved and identifies issues found.

---

## 1. CONTENT UPLOAD (Lecturer-only)

### API Routes

#### [POST /api/lecturer/content](src/app/api/lecturer/content/route.ts)
**Purpose**: Upload new content files  
**Auth**: LECTURER only  
**File**: `src/app/api/lecturer/content/route.ts` (Lines 74-220)

**Implementation**:
- Validates file type (PDF, PPTX, DOCX, JPEG, PNG) and size (max 50MB)
- Parses metadata from FormData: title, module, faculty, semester, program, contentType, description, tutorial link
- Validates input with `contentUploadSchema` (Zod)
- Uploads to Cloudinary with resource_type "auto"
- Creates Content record in database
- Notifies all students in matching faculty/semester via Notification

**Error Handling**:
- ✅ 400 Bad Request: Missing file, unsupported type, file size exceeded, invalid metadata
- ✅ 401 Unauthorized: Non-lecturer role
- ✅ 403 Forbidden: Lecturer uploading to faculty not assigned to them
- ✅ 500 Internal Server Error: Generic catch-all with error logging
- ⚠️ **ISSUE**: Error response includes `details: errorMessage` in 500 response which could expose sensitive information

**BUGS FOUND**:
1. **Cloudinary stream error handling race condition**: The upload promise might reject before stream end event - not fully resilient
2. **No file type validation at Cloudinary level** - relies only on MIME type check
3. **Faculty validation only warns, not enforced** - Line 132: `if (session.user.facultyId &&...` checks existence before validation. If lecturer has no assigned faculty, they can upload anywhere
4. **Notification query doesn't check isActive** - Line 193: Sends to all STUDENT role users, even if suspended
5. **No versioning on first upload** - version starts at 1, good for updates

#### [PATCH /api/lecturer/content/[id]](src/app/api/lecturer/content/[id]/route.ts)
**Purpose**: Update content metadata  
**Auth**: LECTURER (must own content)  
**File**: `src/app/api/lecturer/content/[id]/route.ts` (Lines 7-64)

**Implementation**:
- Validates ownership: only lecturer who created can update
- Validates input with `contentUpdateSchema` (allows partial updates + status field)
- Increments version counter on each update
- Allows editing: title, description, module, status (ACTIVE/DRAFT/ARCHIVED), etc.

**Error Handling**:
- ✅ 401 Unauthorized: Non-lecturer
- ✅ 403 Forbidden: Doesn't own content
- ✅ 404 Not Found: Content not found
- ✅ 400 Bad Request: Validation errors

**BUGS FOUND**:
1. **No re-validation of faculty/semester on edit** - Lecturer could potentially change facultyId to one they're not assigned to (though metadata validation might catch this)
2. **No file replacement capability** - Can only update metadata, not the actual file

#### [DELETE /api/lecturer/content/[id]](src/app/api/lecturer/content/[id]/route.ts)
**Purpose**: Delete (archive) content  
**Auth**: LECTURER (must own content)  
**File**: `src/app/api/lecturer/content/[id]/route.ts` (Lines 66-113)

**Implementation**:
- Soft delete: sets status to "ARCHIVED" instead of hard delete
- Verifies ownership before deletion
- Archived content still exists in DB but is hidden from students

**Error Handling**:
- ✅ 401 Unauthorized: Non-lecturer
- ✅ 403 Forbidden: Doesn't own content  
- ✅ 404 Not Found: Content not found

**BUGS FOUND**:
1. **Soft delete doesn't notify students** - Students don't know why content disappeared
2. **No hard delete option** - 7-day grace period mentioned in PRD but not implemented
3. **No audit log** - Deletion isn't tracked for moderation

#### [GET /api/lecturer/content](src/app/api/lecturer/content/route.ts)
**Purpose**: List lecturer's own content  
**Auth**: LECTURER  
**File**: `src/app/api/lecturer/content/route.ts` (Lines 10-67)

**Implementation**:
- Returns only content owned by current lecturer
- Supports filtering by status (ALL, ACTIVE, DRAFT, ARCHIVED)
- Search by title and module (case-insensitive)
- Paginated: default 20 items, max 50
- Includes faculty and program relationships

**Error Handling**:
- ✅ 401 Unauthorized: Non-lecturer
- ✅ 500 Internal Server Error

**BUGS FOUND**:
1. **No sorting options** - Always returns by createdAt descending, no way to sort by views, downloads, or rating
2. **Pagination not reset on filter change** - Client-side issue in content-table.tsx, server handles it fine
3. **Status "ALL" hardcoded** - Should support all valid statuses, currently skips status filter if value is "ALL"

### Frontend Components

#### [UploadForm Component](src/components/lecturer/upload-form.tsx)
**Purpose**: UI for uploading content  
**File**: `src/components/lecturer/upload-form.tsx`

**Features**:
- File drag-and-drop with visual feedback
- Title, module code, module name inputs
- Faculty dropdown (searchable, uses Popover/Command)
- Semester select (1-maxSemesters from AppSettings)
- Program dropdown (filtered by faculty, dynamic loading)
- Content type select (7 types)
- Optional description textarea (max 500 chars with counter)
- Optional tutorial link (URL validation)
- File upload with size and type display

**Error Handling**:
- ✅ File validation before upload
- ✅ Error messages for failed API calls
- ✅ Loading states for async data

**BUGS FOUND**:
1. **Faculty dropdown error state not connected to UI** - Line 242: `facultiesError &&` shows message but dropdown might still try to load
2. **Programs list not validated on load** - If programs API fails, user can submit without selecting program
3. **No feedback on upload progress** - Cloudinary upload could take time, user sees "Loading..." but no actual progress
4. **Semester dropdown allows empty selection** - No required validation shown until submit
5. **Tutorial link not validated on blur** - Only valid URLs accepted on server, no client-side feedback until submit
6. **Redirect after upload goes to /content not /lecturer/content** - Line 112: Goes to student content page, should go to lecturer dashboard

#### [ContentTable Component](src/components/lecturer/content-table.tsx)
**Purpose**: Table view of lecturer's content  
**File**: `src/components/lecturer/content-table.tsx`

**Features**:
- Tab filters: All, Active, Draft, Archived
- Search by title/module
- Paginated table
- Columns: Title (with version), Module, Type, Status badge, Views, Downloads, Rating
- Actions: Edit, Archive buttons
- Edit dialog pops up for inline editing
- Archive confirmation dialog

**Error Handling**:
- ✅ Shows skeleton loaders while fetching
- ✅ Empty state message
- ⚠️ No error state shown if API fails

**BUGS FOUND**:
1. **Edit dialog allows status change but no validation** - Could set invalid status values
2. **Archive button doesn't disable pending mutations** - User could click archive multiple times
3. **No refresh indicator** - Data might be stale after manual edits
4. **Version counter shown but no history** - User sees v2, v3 but can't see what changed
5. **Table doesn't show fileSize** - Users can't see if they're approaching storage limits

#### [ContentEditDialog Component](src/components/lecturer/content-edit-dialog.tsx)
**Purpose**: Edit content metadata inline  
**File**: `src/components/lecturer/content-edit-dialog.tsx`

**Features**:
- Modal dialog for editing existing content
- Allows editing: title, description, status, etc.
- Cancel/Save buttons with loading state

**Error Handling**:
- ⚠️ Minimal error handling - shows generic error if mutation fails

**BUGS FOUND**:
1. **No validation of status values** - Could set ARCHIVED content back to ACTIVE without permission checks
2. **Description not limited to 500 chars** - Server validates but UI doesn't enforce
3. **No save confirmation** - Changes saved immediately without "Are you sure?" for status changes
4. **Tutorial link validation missing** - Not validated before save

---

## 2. CONTENT DISPLAY & VIEWING (Student-side)

### API Routes

#### [GET /api/content](src/app/api/content/route.ts)
**Purpose**: List content filtered by student's faculty/semester  
**Auth**: Authenticated (any role, but filtering enforced)  
**File**: `src/app/api/content/route.ts` (Lines 6-75)

**Implementation**:
- Server-side enforcement: Returns only content matching user's faculty AND semester
- Supports filters: search (title/module), contentType, module
- Sort options: newest (default), views, downloads
- Paginated: 30 items per page
- Includes lecturer info and faculty name

**Error Handling**:
- ✅ 401 Unauthorized: Not authenticated
- ✅ 500 Internal Server Error

**BUGS FOUND**:
1. **No role-based visibility** - Same query for students, lecturers, admins. Admins should see all content
2. **Status filter hardcoded to "ACTIVE"** - Line 27: `status: "ACTIVE"` always applied. No way to view DRAFT content (by design, but not documented)
3. **Search is OR query** - Title OR module - could return too many results if both match
4. **No filter validation** - contentType, sort params not validated against enum values
5. **Missing indexes** - facultyId, semester checked but no composite index for performance
6. **No caching headers** - Every request hits DB, even identical requests

#### [GET /api/content/[id]](src/app/api/content/[id]/route.ts)
**Purpose**: Get single content detail  
**Auth**: Authenticated  
**File**: `src/app/api/content/[id]/route.ts` (Lines 9-57)

**Implementation**:
- Fetches single content by ID
- Returns ratings only for current user
- For students: enforces faculty/semester match
- For lecturers/admins: allows viewing any content
- Includes faculty, program, lecturer info

**Error Handling**:
- ✅ 401 Unauthorized
- ✅ 403 Access Denied (student from wrong faculty/semester)
- ✅ 404 Not Found (content not found or not ACTIVE)

**BUGS FOUND**:
1. **Only returns ACTIVE content** - Line 36: Checks `status !== "ACTIVE"`. Lecturers can't preview their own DRAFT content via this endpoint
2. **Lecturer can view all content** - No faculty restriction for lecturers. Could view other faculty's content
3. **Admin sees no special data** - Admin viewing content doesn't show who flagged it or moderation status
4. **Rating aggregates only current user** - Other users' ratings not included in response (by design, but document)
5. **No rate limiting** - Anyone can hammer this endpoint to trigger access logging

### Frontend Components

#### [ContentGrid Component](src/components/content/content-grid.tsx)
**Purpose**: Main content browsing interface  
**File**: `src/components/content/content-grid.tsx`

**Features**:
- Displays content in 3-column grid (responsive)
- Filters: Search, Content Type, Sort (newest/views/downloads)
- Pagination with "Load More" button
- Uses ContentCard component for each item

**Error Handling**:
- ✅ Shows error message if fetch fails
- ✅ Shows loading skeleton
- ✅ Empty state if no content matches

**BUGS FOUND**:
1. **No maximum page limit** - User can keep clicking "Load More" infinitely, loading all content into memory
2. **Debounced search causes stale results** - 300ms debounce, but page resets on search change (could lose position)
3. **Sort by downloads/views might be outdated** - No real-time update of counters as content is accessed
4. **Filter state not persisted** - If user navigates away and back, filters reset
5. **Grid doesn't lazy-load images** - All ContentCard images load immediately, could be slow

#### [ContentFilters Component](src/components/content/content-filters.tsx)
**Purpose**: Filter controls for browsing  
**File**: `src/components/content/content-filters.tsx`

**Features**:
- Search input with debouncing
- Content Type dropdown (all types from constants)
- Sort dropdown (newest, views, downloads)

**Error Handling**:
- Minimal - just sets state

**BUGS FOUND**:
1. **Search input not cleared when changing filters** - User might search for one thing, then change type and see stale search
2. **"All Types" option doesn't actually send "all"** - Sends empty string to API, unclear if API handles this
3. **No "All" option for sort** - But sort defaults to newest anyway

#### [ContentCard Component](src/components/content/content-card.tsx)
**Purpose**: Display individual content preview  
**File**: `src/components/content/content-card.tsx`

**Features**:
- Title, module name, lecturer name
- File type badge with color coding
- Views, downloads, rating stats
- Links to detail page

**Error Handling**:
- None - just renders data

**BUGS FOUND**:
1. **No missing data handling** - If lecturer.name is null, shows "by null"
2. **File type badge might use unsupported types** - Only has hardcoded colors for common types

#### [ContentDetailPage](src/app/(student)/content/[id]/page.tsx)
**Purpose**: View full content  
**File**: `src/app/(student)/content/[id]/page.tsx` (Lines 1-150+)

**Features**:
- Back link to content list
- Content header (title, module, lecturer, type, file type)
- Metadata (description, views, downloads, rating, upload date)
- Download and Tutorial buttons
- File viewers:
  - PDF: PdfViewer component with fullscreen
  - PPTX: Google Docs embedded viewer
  - Images: Direct img tag
  - DOCX: Not viewable in-browser (download only)
- ContentRating component (1-5 stars)
- ContentFlag component (report)
- ContentAccessLogger component (logs view)

**Error Handling**:
- ✅ notFound() if content doesn't exist
- ✅ Faculty/semester check, returns notFound() if mismatch

**BUGS FOUND**:
1. **DOCX files have no preview** - User must download to view
2. **Google Docs viewer might fail for very large files** - No error handling if viewer fails to load
3. **PDF viewer might not work without browser plugin** - PdfViewer component must have pdf.js loaded
4. **Access logger fires even if user has no permission** - Line 56 loads ContentAccessLogger, but permission check happens before. Actually OK, checks happen in server-side first.
5. **No download progress indicator** - Large files download silently
6. **File URL exposed in HTML source** - Direct link to Cloudinary visible, could be scraped
7. **No access control on direct file URL** - If someone gets the Cloudinary URL, they can download directly

#### [ContentAccessLogger Component](src/app/(student)/content/[id]/access-logger.tsx)
**Purpose**: Log view access on page load  
**File**: `src/app/(student)/content/[id]/access-logger.tsx` (Lines 1-14)

**Implementation**:
- Fires useEffect on mount
- POSTs to `/api/content/{id}/access` with `accessType: "view"`
- Silently fails with `.catch(() => {})`

**Error Handling**:
- ⚠️ No error handling - catch silently ignores failures

**BUGS FOUND**:
1. **Silent failures** - If logging fails (network error, server error), user doesn't know
2. **Fires even for cached pages** - Browser back/forward button re-mounts component and logs again
3. **Race condition with downloads** - User could download before access is logged
4. **No rate limiting** - Malicious user could rapidly navigate to same content and spike view count

#### [ContentRating Component](src/components/content/content-rating.tsx)
**Purpose**: Rate content 1-5 stars  
**File**: `src/components/content/content-rating.tsx` (Lines 1-85)

**Features**:
- 5-star interactive rating (hover shows preview)
- Optional feedback textarea (only shows after rating selected)
- Submit button

**Error Handling**:
- Shows disabled state while submitting
- Generic error from mutation (shows if rating fails)

**BUGS FOUND**:
1. **Feedback textarea not validated** - No character limit (server validates though)
2. **No success confirmation** - User doesn't know if rating was saved after submit
3. **Textarea shows then hides on successful rate** - UX unclear if submit worked
4. **Current rating shown but not editable feedback** - If user rated before with feedback, they can't see/edit their old feedback in textarea
5. **Rating persists client-side without confirmation** - Star fill state changes before server confirmation

#### [ContentFlag Component](src/components/content/content-flag.tsx)
**Purpose**: Report inappropriate content  
**File**: `src/components/content/content-flag.tsx` (Lines 1-100)

**Features**:
- Report button (dialog trigger)
- Reason dropdown (inaccurate, inappropriate, copyright, other)
- Optional details textarea
- Submit button

**Error Handling**:
- Shows loading state while submitting
- Clears form on success

**BUGS FOUND**:
1. **No duplicate flag prevention on client** - User could submit same report multiple times quickly
2. **No success message** - User doesn't know if flag was submitted (just closes dialog)
3. **Reason values hardcoded** - Not using enum from constants/schema
4. **Details textarea not validated** - Could submit very long strings
5. **If user already flagged, server returns 409 but error shown generically** - User might not understand they already flagged

### Access Control API Routes

#### [POST /api/content/[id]/access](src/app/api/content/[id]/access/route.ts)
**Purpose**: Log content view/download  
**Auth**: Authenticated  
**File**: `src/app/api/content/[id]/access/route.ts` (Lines 9-78)

**Implementation**:
- Records ContentAccess entry (user, content, type)
- Increments viewCount or downloadCount in Content model
- Uses transaction to ensure atomicity
- Validates accessType is "view" or "download"
- For students: enforces faculty/semester match

**Error Handling**:
- ✅ 400 Bad Request: Invalid accessType
- ✅ 401 Unauthorized: Not authenticated
- ✅ 403 Access Denied: Student from wrong faculty/semester
- ✅ 404 Not Found: Content doesn't exist

**BUGS FOUND**:
1. **No rate limiting** - Malicious requests could flood access logs and spike counters
2. **No duplicate detection** - Same user viewing same content multiple times all count
3. **Lecturers/admins can log access** - No role check, they could artificially inflate views
4. **Access logs grow unbounded** - No retention policy, old logs never deleted
5. **Counter increments not atomic with creation** - If create succeeds but update fails, orphaned access record
6. **No logging of who accessed what** - Useful for analytics but access logs might be cleared

#### [POST /api/content/[id]/rate](src/app/api/content/[id]/rate/route.ts)
**Purpose**: Rate content 1-5 stars  
**Auth**: Authenticated  
**File**: `src/app/api/content/[id]/rate/route.ts` (Lines 9-62)

**Implementation**:
- Upserts ContentRating (one rating per user per content)
- Validates rating is 1-5 (Zod schema)
- Recalculates averageRating and updates Content
- Supports optional feedback text

**Error Handling**:
- ✅ 400 Bad Request: Invalid rating (out of range)
- ✅ 401 Unauthorized: Not authenticated
- ✅ 500 Internal Server Error

**BUGS FOUND**:
1. **Average rating recalculation after each rating** - Expensive query on every rating. Better to use DB-level aggregate
2. **No validation of feedback text length** - Server accepts any string
3. **No permission check** - Any user can rate, even if they never accessed the content
4. **Rating not scoped to their faculty** - Student from FICT could rate FBMG content (but can't view it)
5. **No duplicate prevention** - User can spam ratings (just overwrites)

#### [POST /api/content/[id]/flag](src/app/api/content/[id]/flag/route.ts)
**Purpose**: Flag content for moderation  
**Auth**: Authenticated  
**File**: `src/app/api/content/[id]/flag/route.ts` (Lines 9-72)

**Implementation**:
- Creates ContentFlag with reason
- Prevents duplicate flags from same user (409 Conflict)
- Notifies all active admins via Notification
- Returns 201 on creation

**Error Handling**:
- ✅ 400 Bad Request: Missing/invalid reason
- ✅ 401 Unauthorized: Not authenticated
- ✅ 404 Not Found: Content doesn't exist
- ✅ 409 Conflict: Already flagged

**BUGS FOUND**:
1. **No permission check** - Any user can flag, even if they never accessed content (by design, allows anonymous reports)
2. **No scope validation** - Student from wrong faculty could flag content they can't see
3. **Reason text not validated for length** - Could submit huge strings
4. **Admins notified via Notification, not email** - Might miss urgent flags
5. **Reason stored as plain text, not enum** - Client combines reason + details, hard to categorize

---

## 3. CONTENT FILTERING & ACCESS CONTROL

### Authentication & Authorization

**Global Checks**:
- ✅ All routes check session with `auth()`
- ✅ All routes return 401 if unauthenticated
- ✅ Role checks (LECTURER, ADMIN, STUDENT)

**Student Isolation**:
- ✅ GET /api/content filters by facultyId + semester (enforced server-side)
- ✅ GET /api/content/[id] checks faculty/semester match (returns 403 if mismatch)
- ✅ POST /api/content/[id]/access checks faculty/semester match
- ✅ Index on `(facultyId, semester)` for performance

**Lecturer Ownership**:
- ✅ GET /api/lecturer/content filters by lecturerId
- ✅ PATCH /api/lecturer/content/[id] verifies ownership
- ✅ DELETE /api/lecturer/content/[id] verifies ownership

**Admin Access**:
- ✅ GET /api/admin/flags checks role === "ADMIN"
- ✅ PATCH /api/admin/flags/[id] checks role === "ADMIN"
- ⚠️ No admin endpoint to list all content (can't moderate easily)

### Data Models & Relationships

```prisma
model Content {
  id: String (cuid)
  title: String
  description: String?
  fileUrl: String (Cloudinary URL)
  filePublicId: String? (for deletion)
  fileType: String (pdf|pptx|docx|jpeg|png)
  fileSize: Int (bytes)
  facultyId: String (FK to Faculty)
  semester: Int
  programId: String? (FK to Program)
  module: String
  moduleCode: String?
  contentType: ContentType enum
  lecturerId: String (FK to User - ContentAuthor)
  viewCount: Int (default 0)
  downloadCount: Int (default 0)
  averageRating: Float?
  status: ContentStatus (ACTIVE|DRAFT|ARCHIVED)
  version: Int (default 1)
  tutorialLink: String? (URL)
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relationships
  faculty: Faculty
  program: Program?
  lecturer: User (relation "ContentAuthor")
  access: ContentAccess[] (1-to-many)
  ratings: ContentRating[] (1-to-many)
  flags: ContentFlag[] (1-to-many)
  
  // Indexes
  @@index([facultyId, semester])
  @@index([lecturerId])
  @@index([status])
}

model ContentAccess {
  id: String
  contentId: String (FK)
  userId: String (FK)
  accessType: String ("view" | "download")
  createdAt: DateTime
  
  @@index([contentId])
  @@index([userId])
}

model ContentRating {
  id: String
  contentId: String (FK)
  userId: String (FK)
  rating: Int (1-5)
  feedbackText: String?
  createdAt: DateTime
  
  @@unique([contentId, userId]) // One rating per user per content
}

model ContentFlag {
  id: String
  contentId: String (FK)
  reporterId: String (FK to User - FlagReporter)
  reason: String
  status: FlagStatus (PENDING|REVIEWED|RESOLVED)
  adminNotes: String?
  reviewedBy: String? (FK to User - FlagReviewer)
  createdAt: DateTime
  resolvedAt: DateTime?
  
  @@unique([contentId, reporterId]) // One flag per user per content
}
```

**BUGS FOUND**:
1. **No hard delete** - Content.status = ARCHIVED, but never physically deleted. Could accumulate 7-day grace period data mentioned in PRD but not implemented
2. **filePublicId optional** - Should always be set if file uploaded to Cloudinary
3. **No soft delete audit trail** - deletedAt timestamp not in schema
4. **averageRating nullable** - Could be 0 or null, ambiguous
5. **version counter never reset** - Always increments, could overflow theoretically
6. **No created_by tracking on flags** - Can't distinguish between initial report and reviews

### Prisma Schema Validators

#### [Content Validators](src/lib/validators/content.ts)

```typescript
contentUploadSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  facultyId: z.string().min(1),
  semester: z.number().int().min(1),
  programId: z.string().optional(),
  module: z.string().min(1),
  moduleCode: z.string().optional(),
  contentType: z.enum([...]),
  tutorialLink: z.string().url().optional(),
})

contentUpdateSchema = contentUploadSchema
  .extend({ status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional() })
  .partial()

contentRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedbackText: z.string().optional(),
})
```

**BUGS FOUND**:
1. **tutorialLink.url() requires "http://" or "https://"** - Can't validate relative URLs
2. **title, module no max length** - Could be very long strings
3. **description not length-checked** - UI limits to 500, but server doesn't
4. **semester.min(1) allows any integer** - No max check, could set semester to 999
5. **contentUpdateSchema.partial() means all fields optional** - Could PATCH with empty object and do nothing

---

## 4. ERROR HANDLING ISSUES

### Missing Error Scenarios

1. **Cloudinary failures** - upload_stream error handling not robust
2. **Database connection failures** - No retry logic
3. **Notification creation failures** - Don't block content upload but not logged
4. **Concurrent edit conflicts** - No optimistic locking (version field unused for this)
5. **Large file uploads timing out** - No timeout configuration
6. **CORS issues** - Cloudinary URLs might have CORS problems for embedded viewers

### Error Response Inconsistencies

1. Some endpoints return `{ success: false, error: "..." }` (old style)
2. Some endpoints return proper HTTP status codes with body
3. Admin endpoints use ZodError handling, others don't
4. Error logging uses console.error, no structured logging

---

## 5. MISSING FUNCTIONALITY

### By Priority

#### High Priority (Core Features)

1. **Admin content moderation UI** - No admin page to review flags and manage content
2. **Content versioning/history** - version counter exists but not exposed
3. **Soft delete grace period** - PRD mentions 7 days but not implemented
4. **Hard delete functionality** - No admin command to permanently remove content
5. **Content search full-text** - Only substring search, not full-text
6. **Bulk operations** - Can't bulk-archive or bulk-delete
7. **Content expiration** - No way to set content to auto-archive
8. **Storage quota per lecturer** - No limits on total upload size

#### Medium Priority (Enhancement)

1. **Download progress** - No indication of download status
2. **Access statistics** - No per-user access logs visible to lecturer
3. **Content recommendations** - No ML-based suggestions
4. **Content approval workflow** - All content auto-published (admin review would help)
5. **Duplicate detection** - No warning if same file uploaded twice
6. **Content sharing links** - No ability to share outside faculty (by design)

#### Low Priority (Nice to Have)

1. **Content previews** - Thumbnail generation for PDFs/PPTX
2. **Offline viewing** - No download for offline access
3. **Content translation** - No multi-language support
4. **DRM/Watermarking** - No protection against copying
5. **Content licensing** - No Creative Commons or custom licenses

---

## 6. PERFORMANCE ISSUES

1. **Average rating recalculation** - O(n) aggregation on every rating
2. **ContentAccess logs unbounded** - Could grow very large
3. **No database query caching** - Every GET /api/content hits DB
4. **Faculty/semester filter might be slow** - Composite index exists but not verified
5. **ContentGrid loads all cards at once** - No virtualization, could slow with 1000+ items
6. **PDF viewer loads entire file** - No streaming or progressive rendering
7. **Notification sending not batched** - Sends one query per student

---

## 7. SECURITY CONCERNS

### Severity: HIGH

1. **File URL exposure** - Cloudinary URLs visible in page source, could be scraped
2. **PPTX viewer using Google Docs** - Third-party URL encoding might leak URLs
3. **No file scan for malware** - Files uploaded without virus/malware check
4. **No rate limiting on access API** - Could spam logs and inflate counters
5. **Faculty validation only for lecturer** - Admin/lecturer could access other faculty content

### Severity: MEDIUM

1. **Access logs not private** - Admins could see what everyone downloaded
2. **No content expiration** - Very old files still accessible
3. **Duplicate flag prevention key** - `[contentId, reporterId]` but what if reporter ID spoofed?
4. **No HTTPS forced** - Tutorial links could be http:// (not HTTPS-only)
5. **Google Docs viewer might leak API key** - If embedded URL is in logs

### Severity: LOW

1. **Error messages reveal DB structure** - Validation errors show field names
2. **No CSRF token validation shown** - NextAuth should handle it
3. **File type MIME validation** - Could be forged (needs magic bytes check)

---

## 8. SUMMARY: ALL FILES INVOLVED

### API Routes (Backend)

**Content Upload (Lecturer)**:
- ✅ `src/app/api/lecturer/content/route.ts` - POST/GET
- ✅ `src/app/api/lecturer/content/[id]/route.ts` - PATCH/DELETE

**Content Viewing (Student)**:
- ✅ `src/app/api/content/route.ts` - GET list
- ✅ `src/app/api/content/[id]/route.ts` - GET detail
- ✅ `src/app/api/content/[id]/access/route.ts` - POST log view/download
- ✅ `src/app/api/content/[id]/rate/route.ts` - POST rating
- ✅ `src/app/api/content/[id]/flag/route.ts` - POST flag

**Admin Moderation**:
- ✅ `src/app/api/admin/flags/route.ts` - GET list flags
- ✅ `src/app/api/admin/flags/[id]/route.ts` - PATCH review flag

**Analytics**:
- ✅ `src/app/api/lecturer/stats/route.ts` - GET stats summary
- ✅ `src/app/api/lecturer/analytics/route.ts` - GET detailed analytics

### Frontend Components

**Lecturer Upload**:
- ✅ `src/components/lecturer/upload-form.tsx` - Upload form UI
- ✅ `src/components/lecturer/content-table.tsx` - Content list/manage
- ✅ `src/components/lecturer/content-edit-dialog.tsx` - Edit modal
- ✅ `src/components/lecturer/dashboard-stats.tsx` - Stats summary

**Student Browsing**:
- ✅ `src/components/content/content-grid.tsx` - Browse grid
- ✅ `src/components/content/content-card.tsx` - Content card preview
- ✅ `src/components/content/content-filters.tsx` - Filter controls
- ✅ `src/components/content/pdf-viewer.tsx` - PDF viewer
- ✅ `src/components/content/content-rating.tsx` - Rating UI
- ✅ `src/components/content/content-flag.tsx` - Flag/report UI

**Pages**:
- ✅ `src/app/lecturer/upload/page.tsx` - Upload page
- ✅ `src/app/lecturer/content/page.tsx` - Manage content page
- ✅ `src/app/(student)/content/page.tsx` - Browse content page
- ✅ `src/app/(student)/content/[id]/page.tsx` - View content page
- ✅ `src/app/(student)/content/[id]/access-logger.tsx` - View logging

**Admin**:
- ✅ `src/components/admin/content-flags.tsx` - Flag management UI

### Utilities & Config

- ✅ `src/lib/validators/content.ts` - Zod schemas
- ✅ `src/lib/constants.ts` - File size, types, labels
- ✅ `src/lib/cloudinary.ts` - Cloudinary client
- ✅ `src/lib/notifications.ts` - Notification creation
- ✅ `prisma/schema.prisma` - Data models

### Tests

- ✅ `tests/unit/api/content.test.ts` - Unit tests for content routes
- ✅ `tests/integration/content.test.ts` - Integration tests
- ✅ `tests/e2e/student-flow.spec.ts` - E2E tests
- ✅ `tests/e2e/lecturer-flow.spec.ts` - Lecturer flow tests

---

## 9. RECOMMENDATIONS

### Critical Fixes

1. **Add rate limiting** to `/api/content/[id]/access` and `/api/content/[id]/rate`
2. **Implement admin content moderation UI** - Can review flags, archive/delete content
3. **Add malware scanning** before accepting uploads
4. **Validate file magic bytes**, not just MIME type
5. **Implement storage quotas** per lecturer
6. **Add hard delete with grace period** (7 days as per PRD)

### Important Improvements

1. **Optimize average rating calculation** - Use DB-level aggregate if possible
2. **Add content versioning UI** - Show what changed in each version
3. **Implement access log retention policy** - Delete old logs after 30-90 days
4. **Add audit logging** for all content modifications
5. **Implement content approval workflow** - Admin review before publication
6. **Add full-text search** instead of substring matching

### UX Improvements

1. **Upload progress indicator** - Show Cloudinary upload percentage
2. **Success notifications** - Confirm rating, flagging, upload
3. **Duplicate file warning** - Detect if same file uploaded twice
4. **Bulk operations** - Archive/delete multiple at once
5. **Content expiration** - Auto-archive old content

### Security Hardening

1. **Private file URLs** - Serve files through API endpoint with auth check, not direct Cloudinary URL
2. **Malware scanning** - Use ClamAV or similar
3. **Rate limiting globally** - Protect all endpoints
4. **Structured logging** - Replace console.error with proper logging service
5. **Audit logging** - Track all access and modifications for compliance

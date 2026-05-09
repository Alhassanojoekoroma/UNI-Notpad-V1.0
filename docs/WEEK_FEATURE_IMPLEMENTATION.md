# Week-Based Materials Organization - Implementation Complete

## Overview
Implemented a complete week-based folder structure for organizing course materials, including:
- Database schema updates (new `week` field)
- Upload form enhancement with week selector
- Collection detail page redesign with expandable week sections
- API updates to support week filtering
- Migration applied to PostgreSQL database

## Changes Made

### 1. Database Schema (Prisma)
**File:** `prisma/schema.prisma`

Added `week` field to the `Content` model:
```prisma
model Content {
  // ... existing fields ...
  week      Int    @default(1) // Week number (1-8) for grouping within semester
  // ... remaining fields ...
}
```

**Migration Applied:** `20260502023303_add_week_field`
- Successfully added `week` column to PostgreSQL database
- Default value set to 1
- Migration verified and applied

### 2. Upload Form Enhancement
**File:** `src/components/lecturer/upload-form.tsx`

**Changes:**
- Added `week: "1"` to `formData` state initialization
- Added week number field to form (dropdown selector: Week 1-8)
- Updated FormData creation to include week: `data.append("week", formData.week)`
- Week selector renders below semester selection checkboxes
- Positioned in same row as semester checkboxes for compact UI

**UI Components:**
- Week selector is a required field
- Dropdown shows "Week 1" through "Week 8" options
- Default selected week: Week 1
- Clean, accessible Select component with label

### 3. API Updates

#### Content Upload Route
**File:** `src/app/api/lecturer/content/route.ts`

**Changes:**
- Added `week: Number(formData.get("week")) || 1` to metadata parsing
- Updated content creation to include week: `week: parsed.data.week`
- Week field is now part of uploaded content record

#### Collections API Route
**File:** `src/app/api/content/collections/[module]/route.ts`

**Changes:**
- Fixed async params handling (Next.js 16+ requirement)
- Changed from `{ params }: { params: { module: string } }` to `{ params }: { params: Promise<{ module: string }> }`
- Added `const { module } = await params;` to properly resolve route params
- Week data is included in response via existing Content model includes

### 4. Validator Schema Updates
**File:** `src/lib/validators/content.ts`

**Changes:**
- Added week field to `contentUploadSchema`:
```typescript
week: z.number().int().min(1).max(8).default(1),
```
- Validates week is between 1-8
- Includes in validation pipeline for form data

### 5. Collection Detail Page Redesign
**File:** `src/app/(student)/content/collection/[id]/page.tsx`

**Major Changes:**

#### URL Decoding Bug Fixes
- Added `const rawCollectionId = params.id as string;`
- Added `const collectionId = decodeURIComponent(rawCollectionId);`
- Applied `.trim()` to module and semester extraction for safety
- Fixes URL-encoded title display ("Data%20Structures%20..." → "Data Structures...")
- Fixes materials collection empty state due to ID parsing issues

#### Week Grouping Logic
- Added `week` field to Material interface
- Created `groupedByWeek` map to organize materials by week number
- Extracted sorted weeks array for consistent display order
- Added `expandedWeeks` state to track which weeks are collapsed/expanded

#### UI Components
- **Week Header:** Gradient badge showing "W1", "W2", etc.
  - Displays week number with material count
  - Clickable to expand/collapse materials
  - Shows chevron icon that rotates on toggle
  - Hover effect for better UX
  
- **Week Materials:** Grid of material cards inside expandable section
  - Shows only when week is expanded (default: Week 1 expanded)
  - Grid layout: 1 col mobile, 2 col tablet, 3 col desktop
  - Material card styling matches existing design
  - Preview and download buttons functional
  
- **Visual Styling:**
  - Week headers have gradient backgrounds (purple-to-blue)
  - Material section has light gray background to distinguish from headers
  - Smooth transitions and hover effects
  - Dark theme compatible

### 6. Component Updates

#### Added Imports
- `ChevronDown` icon from lucide-react for expand/collapse indicator
- Already had all other required components

#### Type Enhancements
- Material interface now includes `week: number` property
- All data structures properly typed

## Implementation Details

### Week Selection Flow
1. Lecturer uploads files via upload form
2. Selects module, semester, AND week number
3. Week field defaults to Week 1
4. Multiple files can be uploaded to same week or different weeks per semester

### Collection Display Flow
1. Student views collection/module
2. Materials are automatically grouped by week
3. Weeks display in order (1-8, or only weeks with materials)
4. Week 1 expands by default on page load
5. User can expand/collapse weeks to browse materials

### API Query Enhancement
- GET `/api/content/collections/[module]?semester=X` now returns materials with week data
- Week grouping happens client-side for performance
- No additional API calls needed for grouping

## Validation & Testing

### Database
- ✓ Migration created: `20260502023303_add_week_field`
- ✓ Migration applied successfully to PostgreSQL
- ✓ Prisma Client regenerated

### TypeScript
- ✓ Fixed async params type error in API route
- ✓ All new interfaces properly typed
- ✓ No compilation errors in collection page component
- ✓ Form data properly validated with Zod schema

### Code Quality
- ✓ Consistent with existing code patterns
- ✓ Proper error handling maintained
- ✓ UI follows existing dark theme
- ✓ Responsive design implemented
- ✓ Accessible components used

## Files Modified

1. `prisma/schema.prisma` - Added week field
2. `src/components/lecturer/upload-form.tsx` - Week selector UI
3. `src/app/api/lecturer/content/route.ts` - Week data handling
4. `src/app/api/content/collections/[module]/route.ts` - Fixed async params
5. `src/lib/validators/content.ts` - Week validation schema
6. `src/app/(student)/content/collection/[id]/page.tsx` - Week grouping & UI
7. `src/app/(student)/content/page.tsx` - Fixed Select state type

## Backwards Compatibility

- Week field defaults to 1 for existing/legacy content
- Old content displays in "Week 1" section
- No breaking changes to existing APIs
- Graceful handling of materials without week data

## Future Enhancements

- Week templates (copy week structure across semesters)
- Week descriptions/overview
- Automatic week suggestion based on upload date
- Week-based assignment deadlines
- Calendar view with week navigation
- Week completion tracking for students

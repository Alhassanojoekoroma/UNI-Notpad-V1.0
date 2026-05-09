# 🧪 Testing Checklist - Content Management System

## Pre-Test Setup
- [ ] Dev server running on http://localhost:3001
- [ ] Database seeded with test users
- [ ] Environment variables configured

---

## 📌 Test Cases

### Test 1: Lecturer Content Page (404 Fix)
- [ ] Login as lecturer: `fatmata@demo.edu` / `Lecturer123!`
- [ ] Navigate to `/lecturer/content`
- [ ] Page should load without 404
- [ ] "Upload New" button should be visible
- [ ] Button should be clickable and functional

### Test 2: Student Collections View
- [ ] Login as student: `student@demo.edu` / `Student123!`
- [ ] Navigate to `/content`
- [ ] Should see professional collection cards in grid layout
- [ ] Each card should show:
  - [ ] Course name
  - [ ] Category badge (Lectures, Assignments, etc.)
  - [ ] Material count
  - [ ] Progress bar
- [ ] Filter dropdown should work:
  - [ ] Select different semesters
  - [ ] "All Semesters" filter should show all materials
- [ ] Cards should be responsive:
  - [ ] 1 column on mobile
  - [ ] 2-3 columns on tablet
  - [ ] 4 columns on desktop

### Test 3: Collection Detail Page
- [ ] Click on any collection card
- [ ] Should navigate to `/content/collection/[id]`
- [ ] Should see all materials in the collection
- [ ] Each material should display:
  - [ ] Title
  - [ ] Lecturer name
  - [ ] Content type icon (📖, 📝, 🎓, etc.)
  - [ ] Description (if available)
  - [ ] Preview button
  - [ ] Download button
- [ ] "Back to Materials" button should work

### Test 4: Material Preview Modal
- [ ] Click "Preview" button on any material
- [ ] Modal should open with:
  - [ ] Material file preview (left side)
  - [ ] AI chat sidebar (right side)
  - [ ] Download button in header
  - [ ] Close button (X)
- [ ] Preview types:
  - [ ] PDF - should display inline
  - [ ] Images (JPG, PNG) - should display inline
  - [ ] PPTX - should show download fallback
  - [ ] Other formats - should show download fallback

### Test 5: AI Chat in Preview
- [ ] In preview modal, type question: "What is this material about?"
- [ ] Click send or press Enter
- [ ] AI response should appear:
  - [ ] On left side (user message in purple)
  - [ ] On right side (AI response in gray)
  - [ ] Loading animation during response
- [ ] Chat history should remain
- [ ] Multiple messages should work
- [ ] Chat should stay in sync with preview scrolling

### Test 6: Download Functionality
- [ ] Click download button on collection card
- [ ] OR click download button in preview modal
- [ ] File should download to computer
- [ ] File name should match material title

### Test 7: Lecturer Upload with New Material
- [ ] Login as lecturer
- [ ] Go to `/lecturer/upload`
- [ ] Fill in form:
  - [ ] Title: "Advanced Database Concepts"
  - [ ] Module: "Database Theory"
  - [ ] Faculty: Select any
  - [ ] Semester: "1"
  - [ ] Content Type: "LECTURE_NOTES"
- [ ] Upload a PDF file
- [ ] Submit form
- [ ] Should redirect to `/lecturer/content`
- [ ] Should see success message
- [ ] New upload should appear in list

### Test 8: New Material Appears in Student View
- [ ] Login as student (matching the uploaded material's faculty/semester)
- [ ] Go to `/content`
- [ ] "Database Theory" collection should appear
- [ ] Click on it
- [ ] New material should be visible
- [ ] Should be able to preview and download

### Test 9: Responsive Design
- [ ] Open DevTools (F12)
- [ ] Test at different screen sizes:
  - [ ] Mobile (375px)
  - [ ] Tablet (768px)
  - [ ] Desktop (1440px)
- [ ] Collections grid should adapt
- [ ] Cards should maintain proportions
- [ ] Modal should remain usable
- [ ] Chat sidebar should collapse if needed

### Test 10: Semester Filtering
- [ ] Create materials for different semesters (if applicable)
- [ ] Use semester filter dropdown
- [ ] Material count should update
- [ ] Wrong semester materials should be hidden
- [ ] "All Semesters" should show everything

---

## 🐛 Bug Report Template

If you find issues:

```
### Bug Title
[Describe the issue]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. ...

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots
[Attach if relevant]

### Browser/Device
[e.g., Chrome on Desktop, Safari on iPhone]
```

---

## 📊 Feature Completion Status

| Feature | Status | Notes |
|---------|--------|-------|
| 404 Error Fix | ✅ Complete | Button component fixed |
| Collection Cards | ✅ Complete | Professional design implemented |
| Material Preview Modal | ✅ Complete | PDF, image, PPT support |
| AI Chat in Preview | ✅ Complete | Ready for testing |
| Collections API | ✅ Complete | Grouping by module working |
| Student Collections View | ✅ Complete | Responsive grid layout |
| Collection Detail Page | ✅ Complete | Material listing working |
| Semester Filtering | ✅ Complete | Filter dropdown functional |
| Responsive Design | ✅ Complete | Mobile, tablet, desktop |

---

## 🚀 Next Steps (If Needed)

1. **Multi-Semester Assignment**
   - Modify upload form to support multiple semester selection
   - Create duplicate content entries for each semester
   - Estimated: 30 minutes

2. **Batch Upload**
   - Add file drag-and-drop area for multiple files
   - Process multiple uploads in parallel
   - Estimated: 1 hour

3. **Lecturer Dashboard**
   - Create "My Collections" view for lecturers
   - Add statistics (views, downloads, ratings)
   - Estimated: 1.5 hours

4. **Student Favorites**
   - Add heart icon to materials
   - Save favorites to user preferences
   - Create favorites view
   - Estimated: 45 minutes

---

**Test Date**: [_______________]
**Tester**: [_______________]
**Overall Status**: [ ] Pass [ ] Fail
**Notes**: 

```
[Add any additional notes here]
```

# User Story: Child Account Management Screen

**Story ID:** US-UI-P-004  
**Epic:** EPIC-UI-P1  
**Priority:** P1 (High Priority)  
**User Type:** Parent  
**Estimated Points:** 5

## User Story
As a **parent user**, I want to **manage my children's accounts** so that I can **add, edit, or remove child profiles and control their settings**.

## Acceptance Criteria

### AC1: Child Accounts Overview
- **Given** I navigate to Child Account Management
- **When** the page loads
- **Then** I should see:
  - List of all linked child accounts (cards or table)
  - Each child card displays: name, avatar, grade, age, account status
  - "Add New Child" button (prominent)
  - Total child count (e.g., "3 of 5 children")
  - Quick actions: Edit, View Progress, Remove

### AC2: Add New Child Flow
- **Given** I click "Add New Child"
- **When** the modal/form opens
- **Then**:
  - Step 1: Basic info (First name, Last name, Grade/Age)
  - Step 2: Account type selection:
    - "Independent Account" (child has own login)
    - "Parent-Managed" (no separate login, parent controls)
  - Step 3 (if Independent): Create credentials
    - Username (auto-suggested: firstname.lastname)
    - Password (parent sets initial, child changes later)
    - Email (optional for older students)
  - Step 4: Avatar selection (grid of child-friendly avatars)
  - "Cancel" and "Create Child Account" buttons

### AC3: Add Child - Validation
- **Given** I am adding a new child
- **When** I fill in the form
- **Then**:
  - Name fields required (2-50 characters each)
  - Grade/Age selector (Pre-K to 12th grade)
  - Username must be unique across platform (API check)
  - Password requirements displayed if creating credentials
  - Maximum 5 children per parent account enforced
  - Form validates before allowing submission

### AC4: Edit Child Account
- **Given** I click "Edit" on a child account
- **When** the edit modal opens
- **Then** I can modify:
  - Child's name
  - Grade/Age (update as child progresses)
  - Avatar
  - Account type (switch between Independent/Parent-Managed)
  - Learning preferences (subjects, difficulty level)
  - "Save Changes" and "Cancel" buttons
  - Changes reflected immediately upon save

### AC5: Remove/Deactivate Child Account
- **Given** I click "Remove" on a child account
- **When** confirmation dialog appears
- **Then**:
  - Warning message: "Are you sure? This will archive [Child Name]'s account."
  - Options: "Archive" (preserves data) or "Permanently Delete"
  - If archived: Data preserved, account inactive, can be restored
  - If deleted: Data permanently removed after 30-day grace period
  - "Cancel" and "Confirm" buttons
  - Confirmation required (type child's name to confirm)

### AC6: Switch Between Child Views
- **Given** I have multiple children
- **When** I am on any parent screen
- **Then**:
  - Dropdown selector in header/navigation
  - Shows current selected child
  - Click to view list of all children
  - Select child switches context (dashboard, reports update)
  - "View All Children" option for aggregate view

### AC7: Child Account Settings
- **Given** I view a child's account settings
- **When** I access the settings panel
- **Then** I can configure:
  - **Privacy Settings:**
    - Profile visibility (private/family only)
    - Social features enabled/disabled
  - **Notification Settings:**
    - Parent receives child's achievement notifications
    - Weekly progress reports
  - **Content Restrictions:**
    - Grade-appropriate content filter
    - Time limits (daily/weekly learning caps)
  - **Reset Password** (for independent accounts)
  - All settings auto-save with confirmation toast

### AC8: Invitation System (Optional)
- **Given** I want to add an existing student account
- **When** I use the "Link Existing Account" option
- **Then**:
  - Enter child's email or username
  - System sends invitation to child's account
  - Child must accept invitation to link
  - Notification shown when child accepts
  - Parent gains access once accepted

### AC9: Responsive & Accessibility
- **Given** I access child management on any device
- **When** the page renders
- **Then**:
  - Mobile: Stacked card layout, swipe actions
  - Desktop: Grid or table view
  - All modals keyboard accessible
  - Screen reader announces child count and actions
  - Form labels properly associated
  - WCAG 2.1 AA compliance

## Technical Notes
- Use Angular reactive forms with dynamic form arrays for multiple children
- Implement optimistic UI updates (update local state, then sync with API)
- Child account limit (5) enforced server-side and client-side
- Soft delete for account removal (30-day grace period)
- Parent-child relationship stored in database with foreign keys
- Use shared-ui components (avatar selector, confirmation dialogs)
- Cache child list in state management (NgRx or service)

## Dependencies
- Create child API (POST /api/parent/children)
- Update child API (PUT /api/parent/children/:id)
- Delete/Archive child API (DELETE /api/parent/children/:id)
- List children API (GET /api/parent/children)
- Username uniqueness check (GET /api/auth/check-username/:username)
- Avatar assets
- Shared UI components (modal, avatar selector, confirmation dialog)

## UI/UX Specifications
- **Layout:** Card grid (3 columns desktop, 1 column mobile)
- **Colors:** Parent portal brand colors, success green, warning yellow
- **Icons:** Child profile icon, plus icon, edit, trash icons
- **Typography:** Clear hierarchy, bold for child names
- **Animation:** Smooth card add/remove transitions

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests for form validation and child management logic (>80%)
- [ ] Integration tests for add/edit/delete flows
- [ ] E2E test for complete child management workflow
- [ ] 5-child limit enforced and tested
- [ ] Soft delete implementation verified
- [ ] Responsive tested on all devices
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Parent-child linking tested
- [ ] Code reviewed and approved
- [ ] Merged to main branch

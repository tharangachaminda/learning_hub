# User Story: Student Registration Screen

**Story ID:** US-UI-S-003  
**Epic:** EPIC-UI-P0  
**Priority:** P0 (Critical - MVP)  
**User Type:** Student  
**Estimated Points:** 5

## User Story
As a **new student user**, I want to **create an account with my personal information** so that I can **start my personalized learning journey**.

## Acceptance Criteria

### AC1: Registration Form Display
- **Given** I am on the student registration page
- **When** the page loads
- **Then** I should see a multi-step form with:
  - Step 1: Basic Information (Name, Email, Password)
  - Step 2: Profile Details (Age/Grade, Learning Goals)
  - Step 3: Avatar Selection (optional)
  - Progress indicator showing current step
  - "Already have an account? Login" link

### AC2: Step 1 - Basic Information Validation
- **Given** I am on Step 1 of registration
- **When** I enter my information
- **Then**:
  - First name and last name are required (2-50 characters)
  - Email must be valid format and unique (check via API)
  - Password must meet requirements: 8+ chars, 1 uppercase, 1 number, 1 special char
  - Password strength indicator shows (weak/medium/strong)
  - Confirm password must match password field
  - "Next" button only enables when all validations pass

### AC3: Step 2 - Profile Details
- **Given** I completed Step 1
- **When** I am on Step 2
- **Then**:
  - Age/Grade selector dropdown (options: K-12 grades)
  - Multiple-choice learning goals (Math, Science, Reading, etc.)
  - Optional: Subjects of interest checkboxes
  - "Back" and "Next" buttons available

### AC4: Step 3 - Avatar Selection
- **Given** I completed Step 2
- **When** I am on Step 3
- **Then**:
  - Grid of 12+ avatar options displayed
  - Selected avatar has visual highlight
  - Option to skip this step
  - "Back" and "Create Account" buttons available

### AC5: Successful Registration
- **Given** I completed all steps
- **When** I click "Create Account"
- **Then**:
  - Loading spinner appears
  - Account is created via API
  - Welcome email is sent (background process)
  - User is automatically logged in
  - Redirect to onboarding tutorial or dashboard
  - Success notification displayed

### AC6: Error Handling
- **Given** registration fails
- **When** an error occurs
- **Then**:
  - Clear error message shown (e.g., "Email already exists")
  - User stays on current step
  - Form data is preserved
  - User can correct and retry

### AC7: Responsive & Accessibility
- **Given** I access registration on any device
- **When** I navigate the form
- **Then**:
  - Mobile-optimized layout (single column)
  - All steps accessible via keyboard
  - Screen reader compatible with step announcements
  - Form autofill supported where appropriate

## Technical Notes
- Implement debounced email uniqueness check (API call)
- Use Angular reactive forms with custom validators
- Store partial form data in sessionStorage (auto-save)
- Hash password on frontend before sending to API (bcrypt)
- Implement CSRF protection tokens
- Use stepper component from shared-ui library

## Dependencies
- User registration API (POST /api/auth/student/register)
- Email uniqueness check API (GET /api/auth/check-email/:email)
- Avatar image assets (SVG or PNG)
- Shared UI stepper component

## UI/UX Specifications
- **Layout:** Center-aligned card, max-width 600px
- **Colors:** Primary for CTAs, success green for validation
- **Icons:** Use for password visibility toggle, validation states
- **Animation:** Smooth step transitions (slide effect)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests for form validation logic (>85% coverage)
- [ ] E2E test for complete registration flow
- [ ] Email uniqueness check optimized (debounced 500ms)
- [ ] Responsive tested on mobile/tablet/desktop
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Merged to main branch

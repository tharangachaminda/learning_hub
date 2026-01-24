# User Story: Parent Registration Screen

**Story ID:** US-UI-P-003  
**Epic:** EPIC-UI-P0  
**Priority:** P0 (Critical - MVP)  
**User Type:** Parent  
**Estimated Points:** 5

## User Story
As a **new parent user**, I want to **create a parent account** so that I can **manage my children's learning accounts and monitor their progress**.

## Acceptance Criteria

### AC1: Registration Form Display
- **Given** I am on the parent registration page
- **When** the page loads
- **Then** I should see a multi-step form with:
  - Step 1: Parent Account Info (Name, Email, Password)
  - Step 2: Add Child Accounts (optional, can be done later)
  - Step 3: Notification Preferences
  - Progress indicator showing current step
  - "Already have an account? Login" link

### AC2: Step 1 - Parent Account Information
- **Given** I am on Step 1
- **When** I enter my information
- **Then**:
  - First name and last name required (2-50 characters)
  - Email must be valid format and unique (API check)
  - Password requirements: 8+ chars, 1 uppercase, 1 number, 1 special char
  - Password strength indicator (weak/medium/strong)
  - Confirm password must match
  - Phone number (optional, for SMS notifications)
  - "Next" button enables when all required validations pass

### AC3: Step 2 - Add Child Accounts (Optional)
- **Given** I completed Step 1
- **When** I am on Step 2
- **Then**:
  - Option to "Add a child now" or "Skip (add later)"
  - If adding child:
    - Child's first name (required)
    - Child's grade/age (dropdown)
    - Option to create child login credentials OR skip (parent-managed mode)
  - "Add Another Child" button (max 5 children during registration)
  - List of added children displayed with remove option
  - "Back" and "Next" buttons available

### AC4: Step 3 - Notification Preferences
- **Given** I completed Step 2
- **When** I am on Step 3
- **Then**:
  - Email notification toggles:
    - Weekly progress reports (default: on)
    - Achievement notifications (default: on)
    - Learning recommendations (default: on)
  - SMS notification toggle (if phone provided)
  - "Back" and "Create Account" buttons

### AC5: Successful Registration
- **Given** I completed all steps
- **When** I click "Create Account"
- **Then**:
  - Loading spinner appears
  - Parent account created via API
  - Child accounts linked (if added)
  - Welcome email sent with getting started guide
  - User auto-logged in
  - Redirect to Parent Dashboard or onboarding tour
  - Success notification displayed

### AC6: Error Handling
- **Given** registration fails
- **When** an error occurs (e.g., duplicate email)
- **Then**:
  - Clear error message shown
  - User stays on current step
  - Form data preserved
  - User can correct and retry

### AC7: Responsive & Accessibility
- **Given** I access registration on any device
- **When** I navigate the form
- **Then**:
  - Mobile-optimized layout
  - Keyboard navigation functional
  - Screen reader support with step announcements
  - Form autofill supported
  - All interactive elements meet WCAG 2.1 AA standards

## Technical Notes
- Debounced email uniqueness check (500ms)
- Angular reactive forms with nested form groups for children
- sessionStorage for auto-save of partial data
- Parent-child relationship established in database upon registration
- CSRF token protection
- Use shared-ui stepper component with parent theme

## Dependencies
- Parent registration API (POST /api/auth/parent/register)
- Email uniqueness check (GET /api/auth/check-email/:email)
- Child account creation API (POST /api/parent/children)
- Shared UI stepper component
- Parent theme assets

## UI/UX Specifications
- **Layout:** Center-aligned card, max-width 700px
- **Colors:** Parent portal secondary brand colors
- **Icons:** Family/parent-themed icons
- **Animation:** Smooth step transitions
- **Typography:** Professional, parent-focused styling

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests for form validation (>85% coverage)
- [ ] Integration tests for multi-child registration flow
- [ ] E2E test for complete registration process
- [ ] Email uniqueness check optimized
- [ ] Responsive tested on all devices
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Parent-child linking verified in database
- [ ] Code reviewed and approved
- [ ] Merged to main branch

# User Story: Parent Login Screen

**Story ID:** US-UI-P-001  
**Epic:** EPIC-UI-P0  
**Priority:** P0 (Critical - MVP)  
**User Type:** Parent  
**Estimated Points:** 3

## User Story
As a **parent user**, I want to **securely log in to my account** so that I can **monitor my children's learning progress and manage their accounts**.

## Acceptance Criteria

### AC1: Login Form Display
- **Given** I am on the parent login page
- **When** the page loads
- **Then** I should see:
  - Email input field
  - Password input field with show/hide toggle
  - "Remember me" checkbox
  - "Login" button (disabled until form is valid)
  - "Forgot Password?" link
  - "Create Parent Account" link
  - Visual distinction from student login (different color scheme/branding)

### AC2: Form Validation
- **Given** I am entering login credentials
- **When** I interact with the form
- **Then**:
  - Email field validates format in real-time
  - Required field indicators are visible
  - Inline error messages appear below invalid fields
  - Login button enables only when validations pass

### AC3: Successful Authentication
- **Given** I have entered valid parent credentials
- **When** I click "Login"
- **Then**:
  - Loading spinner appears on button
  - Form is disabled during authentication
  - On success, redirect to Parent Dashboard
  - Session persisted if "Remember me" checked
  - Parent role is verified server-side

### AC4: Failed Authentication
- **Given** I entered invalid credentials
- **When** authentication fails
- **Then**:
  - Error message displays: "Invalid email or password"
  - Password field is cleared
  - Form remains enabled for retry
  - After 3 failed attempts, show CAPTCHA
  - Account locked notification after 5 failed attempts

### AC5: Parent vs Student Role Verification
- **Given** I logged in with student credentials on parent login page
- **When** authentication detects wrong user role
- **Then**:
  - Clear error message: "This is a student account. Please use the student login."
  - Link to student login page provided

### AC6: Responsive Design & Accessibility
- **Given** I access the parent login on any device
- **When** the page renders
- **Then**:
  - Form centered and readable on mobile (320px+)
  - Touch targets minimum 44px on mobile
  - Keyboard navigation functional (logical tab order)
  - ARIA labels and screen reader support
  - Focus states clearly visible

## Technical Notes
- Use Angular Reactive Forms
- JWT token storage (localStorage if "remember me", sessionStorage otherwise)
- Implement role-based access control (RBAC) verification
- Use shared-ui components with parent theme variant
- Different route path: `/parent/login` vs `/student/login`
- Rate limiting on frontend to prevent brute force

## Dependencies
- Parent authentication API (POST /api/auth/parent/login)
- Shared UI component library (form inputs, buttons)
- Routing configuration with role guards
- Parent theme/branding assets

## UI/UX Specifications
- **Colors:** Secondary brand colors for parent portal
- **Typography:** Professional font styling (parent-focused)
- **Spacing:** Consistent with design system
- **Branding:** Parent portal logo/header
- **Animation:** Smooth error state transitions

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests for auth flow and role verification
- [ ] Responsive design verified on all devices
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Role-based routing guards implemented
- [ ] Code reviewed and approved
- [ ] Merged to main branch
- [ ] Deployed to staging

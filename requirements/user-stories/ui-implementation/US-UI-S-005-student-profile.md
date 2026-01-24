# User Story: Student Profile Settings Screen

**Story ID:** US-UI-S-005  
**Epic:** EPIC-UI-P1  
**Priority:** P1 (High Priority)  
**User Type:** Student  
**Estimated Points:** 5

## User Story
As a **student user**, I want to **view and update my profile settings** so that I can **personalize my account and manage my preferences**.

## Acceptance Criteria

### AC1: Profile Overview Display
- **Given** I navigate to profile settings
- **When** the page loads
- **Then** I should see:
  - Current avatar with "Change" button
  - Display name (editable)
  - Email (read-only, with verification status)
  - Grade/Age (editable dropdown)
  - Account creation date (read-only)
  - "Save Changes" button (disabled unless changes made)

### AC2: Avatar Customization
- **Given** I click "Change Avatar"
- **When** the avatar selector modal opens
- **Then**:
  - Grid of available avatars displayed
  - Current avatar highlighted
  - Preview of selected avatar shown
  - "Cancel" and "Apply" buttons
  - Changes apply immediately upon "Apply"

### AC3: Personal Information Editing
- **Given** I edit personal information fields
- **When** I make changes
- **Then**:
  - Display name: 2-50 characters, no special chars except space, dash, apostrophe
  - Grade selector: dropdown with K-12 options
  - Real-time validation with inline error messages
  - "Save Changes" button becomes enabled
  - Unsaved changes warning if navigating away

### AC4: Learning Preferences
- **Given** I access the Learning Preferences tab
- **When** the tab loads
- **Then** I should see:
  - Favorite subjects (multi-select checkboxes)
  - Difficulty preference slider (Beginner/Intermediate/Advanced)
  - Daily learning goal (dropdown: 10/20/30/60 minutes)
  - Reminder notifications toggle
  - "Save Preferences" button

### AC5: Account Security Tab
- **Given** I access the Security tab
- **When** the tab loads
- **Then** I should see:
  - "Change Password" section:
    - Current password field
    - New password field with strength indicator
    - Confirm new password field
    - "Update Password" button
  - Two-factor authentication toggle (if enabled in system)
  - Active sessions list with "Sign out all devices" option

### AC6: Notification Settings
- **Given** I access Notification Settings
- **When** the page loads
- **Then** I should see toggles for:
  - Achievement notifications (on/off)
  - Daily reminder notifications (on/off)
  - Weekly progress summary email (on/off)
  - Streak reminder notifications (on/off)
  - All changes auto-save with visual confirmation

### AC7: Save Changes Confirmation
- **Given** I made changes to my profile
- **When** I click "Save Changes"
- **Then**:
  - Loading spinner appears on button
  - Changes persisted via API
  - Success toast notification: "Profile updated successfully"
  - Form returns to pristine state
  - Updated data reflected immediately

### AC8: Error Handling
- **Given** saving changes fails
- **When** an API error occurs
- **Then**:
  - Error message displayed clearly
  - Changes not lost (form data preserved)
  - User can retry save
  - Specific error reason shown (e.g., "Display name already taken")

### AC9: Responsive & Accessibility
- **Given** I access profile settings on any device
- **When** the page renders
- **Then**:
  - Mobile: Tabs converted to accordion/sections
  - All form controls keyboard accessible
  - Screen reader labels for all fields
  - Focus management proper for modals
  - Touch targets minimum 44px on mobile

## Technical Notes
- Use Angular reactive forms with form groups for each section
- Implement `canDeactivate` guard for unsaved changes warning
- Debounce API calls for auto-save features (notification settings)
- Use shared-ui components (avatar selector, toggle switches)
- Validate password strength client-side before submission
- Store avatar images in CDN or static assets

## Dependencies
- Update profile API (PUT /api/student/profile)
- Update preferences API (PUT /api/student/preferences)
- Change password API (POST /api/student/change-password)
- Avatar assets/component
- Shared UI form components

## UI/UX Specifications
- **Layout:** Tab navigation (Profile, Preferences, Security, Notifications)
- **Colors:** Primary for CTAs, success green for confirmations
- **Icons:** Profile, settings, security, bell icons
- **Spacing:** Card-based sections with consistent padding
- **Animation:** Smooth tab transitions, toast notifications

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests for form validation and save logic (>80%)
- [ ] E2E tests for profile update flow
- [ ] canDeactivate guard tested
- [ ] Responsive tested on all devices
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Password security validated
- [ ] Code reviewed and approved
- [ ] Merged to main branch

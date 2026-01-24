# User Story: Notification Center

**Story ID:** US-UI-SHARED-001  
**Epic:** EPIC-UI-P1  
**Priority:** P1 (High Priority)  
**User Type:** Student & Parent  
**Estimated Points:** 5

## User Story
As a **user (student or parent)**, I want to **view and manage my notifications** so that I can **stay informed about important updates, achievements, and system messages**.

## Acceptance Criteria

### AC1: Notification Bell Icon
- **Given** I am logged in to the platform
- **When** I view the header/navigation
- **Then** I should see:
  - Bell icon in top-right corner
  - Unread count badge (red circle with number, e.g., "3")
  - Badge hidden if 0 unread
  - Icon color change or animation when new notification arrives
  - Clicking icon toggles notification dropdown/panel

### AC2: Notification Dropdown Display
- **Given** I click the notification bell
- **When** the dropdown opens
- **Then** I should see:
  - List of recent notifications (latest 10)
  - Each notification showing:
    - Icon (based on type: achievement, system, reminder, etc.)
    - Title/Message preview
    - Timestamp (e.g., "5 minutes ago", "Yesterday")
    - Read/Unread indicator (bold text or dot for unread)
  - "Mark all as read" link
  - "View All Notifications" link (goes to full page)
  - Empty state message if no notifications: "You're all caught up!"

### AC3: Notification Types
- **Given** different notification types exist
- **When** notifications are displayed
- **Then** each type has distinct styling:
  - **Achievement:** Trophy icon, gold accent
  - **Streak Reminder:** Fire icon, orange accent
  - **System:** Info icon, blue accent
  - **Parent Update:** (For students) Parent icon, purple accent
  - **Child Activity:** (For parents) Child icon, green accent
  - **Recommendation:** Lightbulb icon, yellow accent

### AC4: Notification Interactions
- **Given** I see a notification in the list
- **When** I interact with it
- **Then**:
  - Clicking notification marks it as read (if unread)
  - Clicking navigates to relevant page (deep link)
    - Achievement notification → Achievement details
    - Streak reminder → Practice page
    - Child activity (parent) → Child's progress dashboard
  - Swipe left (mobile) reveals "Delete" button
  - Hover shows additional actions: "Mark as read", "Delete"

### AC5: Full Notification Center Page
- **Given** I click "View All Notifications"
- **When** the page loads
- **Then** I should see:
  - Filter tabs: All, Unread, Achievements, System, Activity
  - Complete list of notifications (paginated or infinite scroll)
  - Date grouping: "Today", "Yesterday", "This Week", "Older"
  - Bulk actions: "Select all", "Mark selected as read", "Delete selected"
  - Search bar (filter by keyword)
  - Settings icon (goes to notification preferences)

### AC6: Mark as Read/Unread
- **Given** I want to manage read status
- **When** I use mark actions
- **Then**:
  - "Mark as read" changes notification to read state
  - "Mark as unread" reverts to unread state
  - "Mark all as read" processes all notifications
  - Visual feedback (toast notification: "3 notifications marked as read")
  - Unread count badge updates immediately

### AC7: Delete Notifications
- **Given** I want to remove notifications
- **When** I delete a notification
- **Then**:
  - Single delete: Swipe action or trash icon
  - Confirmation for important notifications (achievements)
  - Bulk delete: Select multiple, click "Delete" button
  - Deleted notifications removed from list immediately
  - Undo option (5-second toast with "Undo" button)

### AC8: Real-Time Updates
- **Given** a new notification is generated
- **When** I am active on the platform
- **Then**:
  - Notification appears in real-time (WebSocket or polling)
  - Badge count increments
  - Bell icon animates (shake/pulse)
  - Toast notification appears briefly (bottom-right corner)
  - Sound plays (if enabled in settings)
  - No page refresh required

### AC9: Notification Settings/Preferences
- **Given** I access notification settings
- **When** the settings page loads
- **Then** I can configure:
  - **In-App Notifications:** (Always on)
  - **Email Notifications:**
    - Daily digest (on/off)
    - Instant for achievements (on/off)
    - Weekly summary (on/off)
  - **Push Notifications:** (if supported)
    - Achievements (on/off)
    - Reminders (on/off)
    - System updates (on/off)
  - **Sound:** Enable/Disable notification sound
  - All changes auto-save with confirmation

### AC10: Responsive & Accessibility
- **Given** I access notifications on any device
- **When** the interface renders
- **Then**:
  - **Mobile:** Full-width dropdown or bottom sheet
  - **Desktop:** Dropdown panel (350px width) below bell icon
  - Keyboard navigation: Tab to notifications, Enter to open
  - Screen reader announces: "You have 3 unread notifications"
  - Notification count announced on update
  - High contrast mode support
  - WCAG 2.1 AA compliance

## Technical Notes
- WebSocket for real-time notifications (fallback to polling every 30s)
- Store notifications in local state (NgRx or service) with persistence
- Implement virtual scrolling for large notification lists (CDK Virtual Scrolling)
- Use RxJS Subject for notification events
- Debounce bulk "mark as read" actions (prevent multiple API calls)
- Toast notifications library: Angular Material Snackbar or custom service
- Implement notification retention policy (30 days, then auto-delete)

## Dependencies
- Notifications API (GET /api/notifications?page=1&filter=unread)
- Mark as read API (PUT /api/notifications/:id/read)
- Delete notification API (DELETE /api/notifications/:id)
- Notification preferences API (PUT /api/user/notification-settings)
- WebSocket connection for real-time updates
- Shared UI components (dropdown, toast, modal)
- Audio file for notification sound (~50KB)

## UI/UX Specifications
- **Layout:** Dropdown max height 500px, scrollable
- **Colors:** Type-specific accent colors, neutral background
- **Icons:** Material Icons or Font Awesome
- **Typography:** Bold for unread, regular for read
- **Animation:** Smooth slide-in for dropdown (200ms), bell shake on new notification
- **Z-index:** Dropdown high priority (1000+)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests for notification logic (>80%)
- [ ] Integration tests for real-time updates
- [ ] E2E test for complete notification workflow
- [ ] WebSocket fallback to polling tested
- [ ] Virtual scrolling implemented and tested
- [ ] Deep linking verified for all notification types
- [ ] Responsive tested on all devices
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Performance tested with 100+ notifications
- [ ] Code reviewed and approved
- [ ] Merged to main branch

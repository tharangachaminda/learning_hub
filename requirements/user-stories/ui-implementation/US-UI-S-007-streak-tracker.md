# User Story: Streak Tracker Component

**Story ID:** US-UI-S-007  
**Epic:** EPIC-UI-P1  
**Priority:** P1 (High Priority)  
**User Type:** Student  
**Estimated Points:** 3

## User Story
As a **student user**, I want to **see my learning streak** so that I am **motivated to maintain daily learning habits**.

## Acceptance Criteria

### AC1: Streak Display on Dashboard
- **Given** I am on the student dashboard
- **When** the page loads
- **Then** I should see a Streak Tracker widget showing:
  - Current streak count (e.g., "7 Days")
  - Fire/flame icon (animated if active today)
  - Longest streak record
  - "Today's status: Complete" or "Keep your streak alive!"
  - Visual calendar showing last 7 days (checkmarks for active days)

### AC2: Streak Calendar Visualization
- **Given** I view the streak tracker
- **When** I look at the calendar
- **Then**:
  - Last 7 days displayed as circular indicators
  - Completed days: filled with checkmark (green)
  - Today (incomplete): outlined, pulsing animation
  - Today (complete): filled with checkmark, confetti burst
  - Missed days: greyed out or X mark
  - Hover tooltip shows date and activity count

### AC3: Active Streak States
- **Given** I have an active streak
- **When** the component renders
- **Then**:
  - **0 days:** Neutral state, "Start your streak today!"
  - **1-6 days:** Growing flame icon (small)
  - **7-13 days:** Medium flame with sparkles
  - **14-29 days:** Large flame with glow effect
  - **30+ days:** Epic flame with halo, special badge
  - Streak count updates in real-time when activity completed

### AC4: Streak Milestone Celebrations
- **Given** I reach a streak milestone
- **When** the milestone is achieved (7, 14, 30, 60, 100 days)
- **Then**:
  - Achievement unlock notification triggers
  - Streak widget shows special animation (fireworks, confetti)
  - Milestone badge displayed
  - Encouragement message: "Incredible! 30-day streak!"

### AC5: Streak at Risk Warning
- **Given** my streak is about to break
- **When** it's late in the day and I haven't completed activity
- **Then**:
  - Warning indicator appears (yellow/orange)
  - Message: "Complete an activity today to keep your streak!"
  - Push notification sent (if enabled) at 6 PM
  - Countdown timer shows time remaining (if timezone detected)

### AC6: Broken Streak Handling
- **Given** I miss a day and break my streak
- **When** the next day begins
- **Then**:
  - Streak count resets to 0
  - Sympathetic message: "Streak reset. Start fresh today!"
  - Longest streak preserved and displayed
  - Option to use "Streak Freeze" (if available as feature)

### AC7: Streak Details Modal
- **Given** I click on the streak tracker
- **When** the modal opens
- **Then** I should see:
  - Full 30-day calendar view
  - Detailed statistics:
    - Current streak
    - Longest streak
    - Total active days
    - Success rate (%)
  - Weekly breakdown chart
  - Upcoming milestones
  - "Close" button

### AC8: Streak Freeze Feature (Optional)
- **Given** I have earned a "Streak Freeze" power-up
- **When** I miss a day
- **Then**:
  - Streak Freeze auto-activates (or manual activation)
  - Streak count maintained
  - Notification: "Streak Freeze used! Your streak is safe."
  - Indicator shows freeze was used on that day
  - Freeze inventory count decreases

### AC9: Responsive & Accessibility
- **Given** I view streak tracker on any device
- **When** the component renders
- **Then**:
  - Mobile: Compact horizontal layout
  - Desktop: Card widget with full details
  - High contrast mode supported
  - Screen reader announces streak count and status
  - Keyboard accessible (tab to focus, enter to open modal)

## Technical Notes
- Real-time streak calculation based on UTC timezone (or user's timezone)
- Activity qualifies for streak: complete 1+ lesson or 5+ questions daily
- Use RxJS interval for countdown timer
- Angular animations for flame effects (CSS animations for performance)
- WebSocket or polling for real-time streak updates
- Store streak data in user profile (backend calculates, frontend displays)
- Cache streak data in localStorage for offline display

## Dependencies
- Streak data API (GET /api/student/streak)
- Activity completion events (WebSocket or API polling)
- Achievement system integration
- Push notification service (for reminders)
- Shared UI calendar component
- Animation assets (flame SVG, particle effects)

## UI/UX Specifications
- **Colors:** Fire gradient (orange, red, yellow), green for complete, grey for missed
- **Icons:** Flame (animated SVG), checkmark, freeze icon
- **Typography:** Bold for streak count (large), regular for labels
- **Animation:** Flame flicker (CSS keyframes), confetti on milestone
- **Layout:** Dashboard widget 300x200px, modal 600x400px

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests for streak calculation logic (>85%)
- [ ] E2E test for streak lifecycle (start, maintain, break, milestone)
- [ ] Animation performance verified (60fps)
- [ ] Timezone handling tested across timezones
- [ ] Responsive tested on mobile/tablet/desktop
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Push notification integration tested
- [ ] Code reviewed and approved
- [ ] Merged to main branch

# User Story: Achievement Unlocked Screen

**Story ID:** US-UI-S-006  
**Epic:** EPIC-UI-P1  
**Priority:** P1 (High Priority)  
**User Type:** Student  
**Estimated Points:** 3

## User Story
As a **student user**, I want to **see celebration screens when I unlock achievements** so that I feel **motivated and rewarded for my learning progress**.

## Acceptance Criteria

### AC1: Achievement Unlock Modal Display
- **Given** I complete an action that unlocks an achievement
- **When** the achievement is triggered
- **Then**:
  - Full-screen or prominent modal overlay appears
  - Celebration animation plays (confetti, sparkles, or badge animation)
  - Achievement badge/icon displayed prominently
  - Achievement title in large, bold text
  - Achievement description text
  - Points earned displayed (e.g., "+50 XP")
  - "Continue" or "Awesome!" button to dismiss
  - Sound effect plays (if audio enabled)

### AC2: Achievement Types Supported
- **Given** different types of achievements exist
- **When** each type is unlocked
- **Then** appropriate visual styling:
  - **Streak Achievements:** Fire/flame themed (e.g., "5-day Streak!")
  - **Completion Achievements:** Star/trophy themed (e.g., "Completed 10 Lessons")
  - **Mastery Achievements:** Crown/gem themed (e.g., "Math Master")
  - **Speed Achievements:** Lightning themed (e.g., "Speed Solver")
  - Each category has distinct color scheme and icon

### AC3: Achievement Details
- **Given** the achievement modal is displayed
- **When** I view the details
- **Then** I should see:
  - Achievement icon (SVG or high-res image)
  - Achievement name/title
  - Descriptive text explaining what was accomplished
  - Rarity indicator (Common/Rare/Epic/Legendary)
  - Date/time unlocked
  - Progress toward next tier (if applicable)
  - Share button (optional: share to parent or social features)

### AC4: Multiple Achievements
- **Given** I unlock multiple achievements simultaneously
- **When** the unlock event occurs
- **Then**:
  - First achievement displayed
  - Indicator showing "1 of 3" achievements
  - "Next" button to cycle through
  - Option to "View All" or "Skip to Continue"
  - All achievements queued and displayed sequentially

### AC5: Animation & Visual Effects
- **Given** achievement modal appears
- **When** the animation plays
- **Then**:
  - Smooth fade-in or slide-up entrance (300-500ms)
  - Badge/icon animates (scale up with bounce effect)
  - Confetti or particle effects (3-5 seconds)
  - Background dim/blur effect for focus
  - Smooth fade-out on dismiss
  - No performance lag or jank

### AC6: Audio Settings Respect
- **Given** user has audio settings configured
- **When** achievement unlocks
- **Then**:
  - If audio enabled: celebration sound plays
  - If audio disabled: silent mode (visual only)
  - If audio muted system-wide: no sound
  - Sound volume respects system settings

### AC7: Accessibility & User Preferences
- **Given** I am using assistive technology
- **When** achievement modal appears
- **Then**:
  - Screen reader announces: "Achievement Unlocked: [Title]"
  - Modal has proper ARIA role and labels
  - Keyboard focus trapped in modal
  - ESC key dismisses modal
  - Reduced motion preference respected (minimal animation)
  - High contrast mode supported

### AC8: Dismissal & Navigation
- **Given** achievement modal is displayed
- **When** I interact with it
- **Then**:
  - "Continue" button dismisses and returns to previous screen
  - Clicking outside modal dims but requires button click (prevent accidental dismiss)
  - Modal auto-dismisses after 10 seconds of inactivity (with countdown indicator)
  - Achievement logged in user history

## Technical Notes
- Use Angular animation library for entrance/exit effects
- Implement particle system library (e.g., canvas-confetti) for celebrations
- Achievement data from API includes: id, type, title, description, icon, rarity, points
- Queue system for multiple achievements (FIFO)
- Play audio using Web Audio API with volume control
- Use CSS transforms for performant animations (GPU acceleration)
- Store "viewed" state to prevent re-showing on page refresh

## Dependencies
- Achievement unlock event from backend (WebSocket or polling)
- Achievement data API (GET /api/achievements/:id)
- Audio files (celebration sounds, ~100KB each)
- Icon/badge assets (SVG preferred, ~10KB each)
- Particle effect library (canvas-confetti or similar)
- Shared UI modal component

## UI/UX Specifications
- **Layout:** Centered modal, 400px width on desktop, 90% width mobile
- **Colors:** Gradient background per achievement type, gold accents for rare
- **Typography:** Bold display font for title, regular for description
- **Animation:** Spring/bounce physics for badge (cubic-bezier easing)
- **Z-index:** High (9999) to overlay all content

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests for achievement queue logic (>80%)
- [ ] Visual regression tests for modal appearance
- [ ] Performance test: animation maintains 60fps
- [ ] Audio implementation tested on multiple browsers
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Reduced motion preference respected
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Code reviewed and approved
- [ ] Merged to main branch

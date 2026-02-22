---
id: US-UI-S-002
title: Student Dashboard Screen
epic: EPIC-UI-PHASE1-MVP
priority: P0
status: Ready for Review
created: 2026-01-24
assignee: TBD
story_points: 5
---

## User Story

**As a** student user  
**I want** to see my personalized dashboard when I log in  
**So that** I can quickly access my learning activities, track progress, and receive AI recommendations

## Description

The Student Dashboard is the main landing page after login, providing an at-a-glance view of the student's learning journey. It displays recent activity, progress indicators, daily goals, AI-powered recommendations, and quick access to practice sessions. The design should be engaging, colorful, and age-appropriate for K-6 students.

## Screen Reference

- **Route:** `/dashboard`
- **Priority:** P0 (Critical - MVP Phase 1)
- **Screen ID:** S1.2.1 in UI Screens Catalog
- **Application:** Student App

## Acceptance Criteria

### Functional Requirements

- [ ] **AC1:** Dashboard loads within 1 second of successful authentication
- [ ] **AC2:** Welcome banner displays student's name and motivational message based on time of day
- [ ] **AC3:** Daily goal widget shows progress toward daily practice minutes with visual progress bar
- [ ] **AC4:** Current streak counter displays consecutive days of practice with flame emoji
- [ ] **AC5:** AI recommendations section suggests 2-3 personalized topics based on recent performance
- [ ] **AC6:** Recent activity feed shows last 3 completed practice sessions with scores
- [ ] **AC7:** Quick practice button initiates a new session with AI-recommended topic
- [ ] **AC8:** Subject cards display available subjects (initially Mathematics) with progress indicators
- [ ] **AC9:** Achievement showcase displays 3 most recent badges/achievements earned
- [ ] **AC10:** Dashboard updates automatically when new data becomes available (no refresh required)

### UI/UX Requirements

- [ ] **AC11:** Uses colorful, child-friendly design with emoji icons and illustrations
- [ ] **AC12:** Responsive layout works on tablet portrait (primary) and desktop (secondary)
- [ ] **AC13:** Smooth transitions between sections with fade/slide animations (<300ms)
- [ ] **AC14:** Cards have hover effects (lift with shadow) on desktop
- [ ] **AC15:** Touch targets minimum 60px for tablet optimization

### Technical Requirements

- [ ] **AC16:** Implements offline capability with cached data fallback
- [ ] **AC17:** Uses MDB 5 card components for consistent styling
- [ ] **AC18:** Integrates with student progress API endpoints
- [ ] **AC19:** Handles loading states with skeleton loaders
- [ ] **AC20:** Implements error handling with friendly error messages

### Performance Requirements

- [ ] **AC21:** Initial load completes in <1 second
- [ ] **AC22:** Recommendations update based on latest session data
- [ ] **AC23:** Dashboard sections load progressively (hero first, details after)
- [ ] **AC24:** Images optimized for web (WebP format, lazy loading)

### Accessibility Requirements

- [ ] **AC25:** Screen reader compatible with proper ARIA labels
- [ ] **AC26:** Keyboard navigation support for all interactive elements
- [ ] **AC27:** Color contrast ratios meet WCAG 2.1 AA standards
- [ ] **AC28:** Text content scalable up to 200% without loss of functionality

## Technical Details

### MDB 5 Components Required

- `<mdb-card>` for dashboard sections
- `<mdb-progress>` for daily goal and subject progress
- `<mdb-btn>` for quick practice CTA
- `<mdb-badge>` for streak counter and new badges
- `<mdb-list-group>` for recent activity feed

### Angular Component Structure

```
student-dashboard/
  ├── student-dashboard.component.ts
  ├── student-dashboard.component.html
  ├── student-dashboard.component.scss
  ├── student-dashboard.component.spec.ts
  └── components/
      ├── daily-goal-widget/
      ├── ai-recommendations/
      ├── recent-activity/
      └── achievement-showcase/
```

### API Endpoints

- **GET** `/api/students/{id}/dashboard` - Main dashboard data
- **GET** `/api/students/{id}/recommendations` - AI recommendations
- **GET** `/api/students/{id}/progress/summary` - Progress aggregates
- **GET** `/api/students/{id}/achievements/recent` - Latest achievements

### Data Models

```typescript
interface DashboardData {
  student: StudentProfile;
  dailyGoal: {
    targetMinutes: number;
    completedMinutes: number;
    percentage: number;
  };
  streak: {
    current: number;
    longest: number;
  };
  recommendations: TopicRecommendation[];
  recentActivity: PracticeSession[];
  achievements: Achievement[];
  subjects: SubjectProgress[];
}
```

## Dependencies

- Student authentication (US-AUTH-001)
- Progress tracking backend (Epic 04)
- AI recommendation engine
- Achievement system

## Testing Considerations

### Unit Tests

- Dashboard data loading and state management
- Calculation of progress percentages
- Conditional rendering of sections based on data availability
- Error state handling

### Integration Tests

- API integration with all dashboard endpoints
- Real-time data updates
- Navigation to practice session from recommendations
- Offline mode with cached data

### E2E Tests

- Complete login → dashboard → quick practice flow
- Dashboard displays correctly for new student (no history)
- Dashboard displays correctly for active student (with history)
- Cross-browser testing (Chrome, Safari, Firefox)
- Tablet device testing (iPad, Android tablets)

## Design Mockups

- Figma: [Link to dashboard mockup]
- Mobile: [Link to tablet mockup]

## Notes

- Dashboard content should be age-appropriate and encouraging
- Consider A/B testing different motivational messages
- Future enhancement: Multiple subjects support
- Future enhancement: Parent message inbox widget
- Animation library: Consider Angular Animations for smooth transitions

## Definition of Done

- [ ] Code implemented and follows Angular style guide
- [ ] All acceptance criteria met and tested
- [ ] Unit tests written with >80% coverage
- [ ] Integration tests passing
- [ ] E2E tests for critical path passing
- [ ] Code reviewed and approved
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met (<1s load)
- [ ] Documentation updated
- [ ] Deployed to staging environment
- [ ] Product Owner acceptance received

---

**Last Updated:** 2026-01-24  
**Related Stories:** US-AUTH-001, US-SI-003, US-QG-001

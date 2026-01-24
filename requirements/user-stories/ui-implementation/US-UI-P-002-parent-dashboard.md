# User Story: Parent Dashboard

**Story ID:** US-UI-P-002  
**Epic:** EPIC-UI-P1 (Phase 1 - MVP Core UI)  
**Priority:** P0 (Critical)  
**Story Points:** 7  
**Sprint:** MVP Sprint 2  
**Created:** January 24, 2026

---

## User Story

As a **parent user**,  
I want **to view a comprehensive dashboard showing my child's learning progress, patterns, and AI-driven insights**,  
So that **I can understand their academic performance, identify areas needing support, and celebrate achievements**.

---

## Story Context

### Existing System Integration

- **Integrates with:** 
  - Parent dashboard API (`GET /api/parents/{id}/dashboard`)
  - Student analytics API (`GET /api/parents/{id}/students/{studentId}/analytics`)
- **Technology:** Angular 20.x, Angular MDB 5, Chart.js/ng2-charts, TypeScript
- **Follows pattern:** Dashboard pattern with card-based layout and data visualization
- **Touch points:** 
  - Analytics service for metrics data
  - Chart library for data visualization
  - Student profile service for multi-student support
  - AI insights service for recommendations

### Screen Reference

- **Screen ID:** P2.2.1 (from UI Screens Catalog)
- **Route:** `/parent/dashboard`
- **Component Path:** `apps/parent-app/src/app/features/dashboard/parent-dashboard/`

---

## Acceptance Criteria

### Functional Requirements

1. **Dashboard Header**
   - GIVEN I am logged in as a parent
   - WHEN I view the dashboard
   - THEN I see "Welcome back, [Parent Name]!"
   - AND I see student selector dropdown (if multiple students)
   - AND I see current date/time period selector

2. **Key Metrics Row (Top Cards)**
   - GIVEN I view the dashboard
   - WHEN it loads
   - THEN I see 4 metric cards showing:
     - **This Week:** Total questions attempted
     - **Average Accuracy:** Percentage with trend indicator (↑↓)
     - **Practice Streak:** Days in a row with visual flame icon
     - **Time Spent:** Total learning minutes this week
   - AND each card has an icon, value, and trend comparison

3. **Performance Chart**
   - GIVEN I view the performance section
   - WHEN it loads
   - THEN I see a line/area chart showing:
     - X-axis: Last 7 days
     - Y-axis: Questions attempted and accuracy %
     - Dual-line chart (questions + accuracy)
   - AND I can toggle between time periods (7 days, 30 days, all time)
   - AND chart updates smoothly with animations

4. **Topic Breakdown Section**
   - GIVEN I view topic breakdown
   - WHEN it loads
   - THEN I see a horizontal bar chart or table showing:
     - Topic name (Addition, Subtraction, etc.)
     - Mastery level (0-3 stars): ⭐⭐⭐
     - Progress bar showing completion %
     - Accuracy rate per topic
   - AND topics are sorted by mastery level (lowest first to highlight focus areas)

5. **Focus Areas & Recommendations**
   - GIVEN the dashboard loads
   - WHEN AI analysis completes
   - THEN I see "Focus Areas" card showing:
     - Top 3 topics where student struggles (accuracy <70%)
     - AI-generated recommendations (e.g., "More practice needed in division")
     - Suggested actions ("Review multiplication basics first")
   - AND recommendations are actionable and specific

6. **AI Insights Card**
   - GIVEN AI has analyzed patterns
   - WHEN I view insights
   - THEN I see 2-3 key insights like:
     - "Emma performs better in morning sessions"
     - "Multiplication accuracy improving (+15% this week)"
     - "Ready for advanced addition concepts"
   - AND insights reference specific data points
   - AND insights use encouraging, growth-oriented language

7. **Recent Activity Timeline**
   - GIVEN I view recent activity
   - WHEN it loads
   - THEN I see a chronological list of recent sessions:
     - Session date/time
     - Topic practiced
     - Questions attempted and accuracy
     - Duration
   - AND I can click a session to see detailed breakdown (future story)
   - AND timeline shows last 5 sessions by default

8. **Weekly Goals Progress**
   - GIVEN weekly goals are set
   - WHEN I view goals section
   - THEN I see progress toward goals:
     - Practice minutes goal (e.g., 180/300 minutes)
     - Questions goal (e.g., 75/100 questions)
   - AND progress bars show completion %
   - AND I see days remaining in the week

### Integration Requirements

9. **API Integration - Dashboard Data**
   - GET `/api/parents/{id}/dashboard` returns:
     ```json
     {
       "student": { "id": "string", "name": "string", "avatar": "string" },
       "metrics": {
         "weekQuestions": 45,
         "averageAccuracy": 78.5,
         "accuracyTrend": 2.3,
         "streakDays": 5,
         "weekMinutes": 180
       },
       "performanceData": [
         { "date": "2026-01-18", "questions": 10, "accuracy": 80 }
       ],
       "topicBreakdown": [
         { "topic": "Addition", "mastery": 3, "progress": 95, "accuracy": 92 }
       ],
       "focusAreas": [
         { "topic": "Division", "accuracy": 65, "recommendation": "..." }
       ],
       "aiInsights": [
         { "type": "pattern", "insight": "..." }
       ],
       "recentSessions": [
         { "id": "string", "date": "...", "topic": "...", "questions": 10, "accuracy": 80, "duration": 15 }
       ],
       "goals": {
         "weeklyMinutes": { "target": 300, "current": 180 },
         "weeklyQuestions": { "target": 100, "current": 75 }
       }
     }
     ```

10. **Data Refresh**
    - Dashboard data refreshes on page load
    - Auto-refresh every 5 minutes if page is active
    - Manual refresh button available
    - Loading indicators during refresh

11. **State Management**
    - Selected student ID persisted
    - Selected time period persisted
    - Chart view preferences saved
    - Dashboard data cached for offline viewing

### Quality Requirements

12. **Performance**
    - Dashboard loads in under 2 seconds
    - Charts render in under 1 second
    - Data refresh doesn't block interaction
    - Smooth chart animations (<300ms)

13. **Accessibility**
    - Chart data available in table format for screen readers
    - Keyboard navigation for all interactive elements
    - ARIA labels for all metrics and charts
    - High contrast mode supported
    - Focus indicators visible

14. **Responsive Design**
    - Desktop (1024px+): 3-column layout for metrics
    - Tablet (768px-1023px): 2-column layout
    - Mobile (< 768px): Single column, stacked cards
    - Charts responsive and legible on all sizes

15. **User Experience**
    - Loading skeletons while data fetches
    - Empty states for no data scenarios
    - Error states with retry option
    - Smooth transitions between time periods
    - Tooltips on hover for additional context

### Testing Requirements

16. **Unit Tests**
    - Component renders all sections correctly
    - Metric calculations accurate
    - Chart data transformation works
    - Time period filtering works
    - Empty state handling

17. **Integration Tests**
    - Dashboard API integration
    - Chart library integration
    - Student selector functionality
    - Data refresh mechanism

18. **E2E Tests**
    - Parent login → dashboard loads with data
    - Switch between students (multi-student scenario)
    - Change time period → chart updates
    - Refresh data → new data displayed

---

## Technical Notes

### MDB 5 Components Used
- `<mdb-card>` - Metric cards, section containers
- `<mdb-chart>` or Chart.js - Performance visualization
- `<mdb-table>` - Topic breakdown table
- `<mdb-select>` - Student selector, time period selector
- `<mdb-badge>` - Trend indicators, mastery stars
- `<mdb-btn>` - Refresh button, action buttons
- `<mdb-carousel>` - Insights carousel

### Component Structure
```typescript
parent-dashboard/
  ├── parent-dashboard.component.ts       // Smart component
  ├── parent-dashboard.component.html     // Template
  ├── parent-dashboard.component.scss     // Styles
  ├── parent-dashboard.component.spec.ts  // Tests
  └── components/
      ├── metrics-row/                    // Top 4 metrics cards
      │   ├── metric-card/
      ├── performance-chart/              // Time-series chart
      ├── topic-breakdown/                // Topic mastery table/chart
      ├── focus-areas/                    // AI recommendations
      ├── ai-insights-card/               // Pattern insights
      └── recent-activity/                // Session timeline
```

### Chart Configuration
```typescript
// Using ng2-charts with Chart.js
{
  type: 'line',
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Questions',
        data: [10, 15, 8, 12, 20, 5, 10],
        borderColor: '#1976D2',
        tension: 0.4
      },
      {
        label: 'Accuracy %',
        data: [80, 75, 85, 78, 82, 90, 88],
        borderColor: '#4CAF50',
        yAxisID: 'y1'
      }
    ]
  }
}
```

### State Management
- Use Angular service to cache dashboard data
- Observable streams for real-time updates
- Local storage for preferences (student, time period)

### Key Dependencies
- `ng2-charts` or `@swimlane/ngx-charts` for charting
- `angular-mdb` for UI components
- `rxjs` for data streams
- Analytics service (`features/analytics/services/analytics.service`)
- `date-fns` or `dayjs` for date handling

### API Contract
```typescript
interface ParentDashboard {
  student: StudentProfile;
  metrics: DashboardMetrics;
  performanceData: PerformanceDataPoint[];
  topicBreakdown: TopicMastery[];
  focusAreas: FocusArea[];
  aiInsights: Insight[];
  recentSessions: SessionSummary[];
  goals: WeeklyGoals;
}

interface DashboardMetrics {
  weekQuestions: number;
  averageAccuracy: number;
  accuracyTrend: number;  // +/- percentage
  streakDays: number;
  weekMinutes: number;
}
```

---

## Definition of Done

- [x] Component structure created
- [ ] All metric cards display correctly with real data
- [ ] Performance chart renders with dual-line visualization
- [ ] Topic breakdown shows mastery levels and progress
- [ ] Focus areas display AI recommendations
- [ ] AI insights card shows pattern-based insights
- [ ] Recent activity timeline displays sessions
- [ ] Weekly goals show progress
- [ ] Student selector works (multi-student support)
- [ ] Time period selector updates chart data
- [ ] API integration complete and working
- [ ] Data refresh mechanism implemented
- [ ] Loading states for all data sections
- [ ] Empty states handled gracefully
- [ ] Error handling with retry option
- [ ] Accessibility requirements met
- [ ] Responsive design verified (desktop, tablet, mobile)
- [ ] Chart tooltips and interactions working
- [ ] Unit tests written with >80% coverage
- [ ] Integration tests pass
- [ ] E2E test for dashboard flow passes
- [ ] Performance requirements met (<2s load)
- [ ] Cross-browser testing passed
- [ ] Code review completed

---

## Dependencies

### Blockers
- Backend dashboard API operational
- Analytics calculation service implemented
- AI insights generation service working
- Chart library integrated (ng2-charts or alternative)

### Related Stories
- **US-UI-P-001:** Parent Login (entry point)
- **Future:** Detailed session drill-down (click on recent activity)
- **Future:** Weekly report export/email functionality

---

## Design Assets

Reference [ui-screens-catalog.md](../../../docs/ui-screens-catalog.md) Section P2.2.1 for:
- Metric card designs
- Chart color schemes and styling
- Topic breakdown layout
- AI insights card format
- Recent activity timeline design
- Responsive breakpoints

---

**Story Owner:** Frontend Team  
**Reviewers:** UX Team, Backend Team (Analytics), QA Team  
**Estimated Hours:** 52-56 hours  
**Complexity:** High (data visualization, multiple integrations)


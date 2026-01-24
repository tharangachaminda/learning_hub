# User Story: Learning Report Screen

**Story ID:** US-UI-P-005  
**Epic:** EPIC-UI-P1  
**Priority:** P1 (High Priority)  
**User Type:** Parent  
**Estimated Points:** 5

## User Story
As a **parent user**, I want to **view detailed learning reports for my children** so that I can **understand their progress, strengths, and areas needing improvement**.

## User Story
As a **parent user**, I want to **view detailed learning reports for my children** so that I can **understand their progress, strengths, and areas needing improvement**.

## Acceptance Criteria

### AC1: Report Overview
- **Given** I navigate to Learning Reports
- **When** the page loads
- **Then** I should see:
  - Child selector (if multiple children)
  - Date range selector (This Week, This Month, Last 30 Days, Custom)
  - Report summary cards:
    - Total learning time
    - Questions answered
    - Lessons completed
    - Current streak
  - Download/Export button (PDF, CSV)

### AC2: Subject Performance Breakdown
- **Given** I view the subject performance section
- **When** the data loads
- **Then** I should see:
  - List of subjects studied (Math, Science, Reading, etc.)
  - Each subject showing:
    - Progress bar (% mastery)
    - Questions answered/correct
    - Time spent
    - Difficulty level
  - Color-coded performance (green: strong, yellow: moderate, red: needs attention)
  - "View Details" link for each subject

### AC3: Progress Over Time Chart
- **Given** I view the progress chart
- **When** the page renders
- **Then**:
  - Line/bar chart showing activity over selected date range
  - Y-axis: Questions answered or Time spent
  - X-axis: Date
  - Toggle between: Daily, Weekly, Monthly views
  - Hover tooltips showing exact values
  - Legend if multiple metrics displayed
  - Responsive chart (scales on mobile)

### AC4: Strengths & Weaknesses Analysis
- **Given** I view the insights section
- **When** the analysis loads
- **Then** I should see:
  - **Strengths:** Top 3 performing topics
    - Topic name
    - Success rate %
    - Recommendation: "Continue challenging in [topic]"
  - **Needs Improvement:** Bottom 3 topics
    - Topic name
    - Success rate %
    - Recommendation: "Practice more [topic] problems"
  - AI-generated insights (if available)

### AC5: Activity Timeline
- **Given** I view the activity timeline
- **When** the section loads
- **Then** I should see:
  - Chronological list of recent activities
  - Each entry showing:
    - Date and time
    - Activity type (Lesson, Practice, Quiz)
    - Subject and topic
    - Duration
    - Score/Result
  - Filter options: All Activities, Lessons Only, Practice Only
  - Pagination or "Load More" (20 items per page)

### AC6: Achievement History
- **Given** I view achievements section
- **When** the page loads
- **Then** I should see:
  - List of all unlocked achievements
  - Achievement badge icon
  - Achievement name and description
  - Date unlocked
  - Filter: All, Recent (last 30 days), By Type
  - Visual progress toward next achievement milestones

### AC7: Learning Recommendations
- **Given** the system has analyzed child's performance
- **When** recommendations section displays
- **Then** I should see:
  - 3-5 personalized recommendations
  - Each recommendation includes:
    - Title (e.g., "Focus on Multiplication")
    - Reason (based on performance data)
    - Suggested actions (specific lessons or practice sets)
    - "Start Now" button (deep link to content)
  - AI-powered insights if available

### AC8: Export Report
- **Given** I want to save or share the report
- **When** I click "Download Report"
- **Then**:
  - Modal appears with export options:
    - Format: PDF or CSV
    - Date range selector
    - Include sections (checkboxes for each section)
  - "Generate Report" button
  - Report generated and downloaded
  - PDF: Formatted, printable with charts
  - CSV: Raw data for further analysis

### AC9: Comparison View (Optional)
- **Given** I have multiple children
- **When** I enable comparison mode
- **Then**:
  - Side-by-side view of selected children
  - Key metrics compared in table format
  - Charts overlay multiple children (different colors)
  - Privacy-respecting (no competitive language)

### AC10: Responsive & Accessibility
- **Given** I access reports on any device
- **When** the page renders
- **Then**:
  - Mobile: Stacked sections, swipeable charts
  - Desktop: Multi-column layout with charts
  - Charts accessible to screen readers (data table alternative)
  - Keyboard navigation for all interactive elements
  - High contrast mode support
  - WCAG 2.1 AA compliance

## Technical Notes
- Use charting library: Chart.js or Recharts (Angular-compatible)
- Lazy load chart data (initial view loads summary, charts load on demand)
- Cache report data in service/state management for performance
- PDF generation: use jsPDF or pdfmake library
- CSV export: convert JSON data to CSV format
- Implement date range filtering with RxJS operators (debounce, distinctUntilChanged)
- Use virtual scrolling for long activity timelines (CDK Virtual Scrolling)

## Dependencies
- Learning report API (GET /api/parent/children/:id/report?from=&to=)
- Subject performance API (GET /api/parent/children/:id/subjects)
- Activity timeline API (GET /api/parent/children/:id/activities)
- Achievements API (GET /api/parent/children/:id/achievements)
- Recommendations API (GET /api/parent/children/:id/recommendations)
- Chart.js or Recharts library
- PDF generation library (jsPDF, pdfmake)
- Shared UI date picker component

## UI/UX Specifications
- **Layout:** Dashboard-style with card sections
- **Colors:** Parent brand colors, data visualization palette (avoid red/green only)
- **Charts:** Clean, minimal design with clear labels
- **Typography:** Data-focused, clear hierarchy
- **Icons:** Subject icons, achievement badges
- **Spacing:** Generous whitespace for readability

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests for data transformation logic (>80%)
- [ ] Chart rendering tested across browsers
- [ ] PDF export generates correctly formatted reports
- [ ] CSV export includes all selected data
- [ ] Date range filtering works correctly
- [ ] Responsive tested on all devices
- [ ] Accessibility compliance (WCAG 2.1 AA, chart alternatives)
- [ ] Performance tested with large datasets (1000+ activities)
- [ ] Code reviewed and approved
- [ ] Merged to main branch

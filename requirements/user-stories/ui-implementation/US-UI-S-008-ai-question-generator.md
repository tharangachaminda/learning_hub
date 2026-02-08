# User Story: AI Question Generator — Generation Controls

**Story ID:** US-UI-S-008  
**Epic:** EPIC-UI-P1 (Phase 1 - MVP Core UI)  
**Priority:** P0 (Critical)  
**Story Points:** 5  
**Sprint:** MVP Sprint 2  
**Created:** February 8, 2026  
**Spec Reference:** `docs/technical/ai-question-generator-frontend-spec.md` §3, §4, §7, §11

---

## User Story

As a **student user**,  
I want **to configure and generate a personalised set of AI-powered maths questions by selecting my topic, category, difficulty, and question count**,  
So that **I can practise questions that are relevant to my grade level and learning needs**.

---

## Story Context

### Existing System Integration

- **Integrates with:**
  - Question generation API (`GET /api/math-questions/generate?difficulty=grade_3&count=10&type=addition`)
  - Health check API (`GET /api/math-questions/health`)
  - Student profile (mock service for MVP — grade & country)
  - Curriculum data (`GRADE_TOPICS`, `QUESTION_CATEGORIES`, `QUESTION_TYPE_DISPLAY_NAMES`)
- **Technology:** Angular 20.x, Angular MDB 5, TypeScript, Signals, Standalone Components
- **Follows pattern:** Smart/Presentation component split with `inject()` DI
- **Touch points:**
  - `QuestionGeneratorService` for API calls
  - Mock profile service for student grade/country
  - Shared curriculum data from `curriculum.types.ts`

### Screen Reference

- **Screen ID:** S1.3.2 (from AI Question Generator Frontend Spec)
- **Route:** `/practice/generate`
- **Component Path:** `apps/student-app/src/app/features/practice/question-generator/`

---

## Acceptance Criteria

### Functional Requirements

1. **Route & Navigation**
   - GIVEN I am a logged-in student
   - WHEN I navigate to `/practice/generate`
   - THEN I see the AI Question Generator screen
   - AND the generation controls (Phase 1) are displayed
   - AND a health check is performed on component init
   - AND if the backend is unhealthy, I see a friendly error banner

2. **Grade Dropdown (Pre-filled)**
   - GIVEN I am on the generation controls screen
   - WHEN the screen loads
   - THEN I see a Grade dropdown (`mdb-select`) pre-filled from my profile (grades 3–8)
   - AND I can change the grade to any value between 3 and 8
   - AND changing the grade resets the Topic dropdown to the first available topic for that grade

3. **Topic Dropdown (Filtered by Grade)**
   - GIVEN I have a grade selected
   - WHEN the Topic dropdown renders
   - THEN it shows only topics available for my selected grade (from `GRADE_TOPICS[grade].mathematics`)
   - AND topics show user-friendly display names (from `QUESTION_TYPE_DISPLAY_NAMES`)
   - AND the first topic is auto-selected
   - AND changing the grade refreshes the topic list immediately

4. **Category Card Selection**
   - GIVEN I am on the generation controls screen
   - WHEN I view the category selector
   - THEN I see 4 category cards in a 2×2 grid:
     - 🧮 Number Operations & Arithmetic
     - ƒ(x) Algebra & Patterns
     - 📐 Geometry & Measurement
     - 🧠 Problem Solving & Reasoning
   - AND each card shows icon, name, and 1-line description
   - AND "Number Operations & Arithmetic" is selected by default
   - AND I can select one category at a time (single-select)
   - AND the selected card has `--primary-color` border (3 px) and `#e8f0fe` background
   - AND on mobile (<768 px) the cards stack into a single column

5. **Difficulty Toggle**
   - GIVEN I am on the generation controls screen
   - WHEN I view the difficulty selector
   - THEN I see a toggle button group with three options: Easy, Medium, Hard
   - AND "Easy" is selected by default
   - AND Easy is colour-coded green (`--secondary-color`), Medium amber (`--accent-color`), Hard red (`--warning-color`)
   - AND only one difficulty can be selected at a time

6. **Question Count Slider**
   - GIVEN I am on the generation controls screen
   - WHEN I view the count selector
   - THEN I see a range slider with a number badge above the thumb
   - AND the range is 5–25 with step 5
   - AND the default value is 10
   - AND the badge updates as I drag the slider

7. **Generate Button**
   - GIVEN I have a topic selected
   - WHEN I view the "🚀 Generate Questions" button
   - THEN it is enabled (`.btn-primary-student` style: 56 px height, 18 px font)
   - AND if no topic is selected, the button is disabled
   - AND when I click Generate, the button shows a spinner with "Generating…" text
   - AND all controls are disabled during the API request
   - AND a loading overlay appears with encouraging text: "🎨 Creating your questions…"

8. **Country (Hidden)**
   - GIVEN the generation controls are configured
   - WHEN the API request is made
   - THEN the student's country from their profile is included silently in the request
   - AND if no country is available, it falls back to `NZ`
   - AND the country field is never displayed to the student

9. **API Call**
   - GIVEN I click the Generate button
   - WHEN the API request fires
   - THEN `GET /api/math-questions/generate` is called with `difficulty`, `count`, and `type` query params
   - AND on success, the screen transitions from Phase 1 (controls) to Phase 2 (questions)
   - AND on error, a friendly error card is shown with "🔄 Try Again" and "🏠 Back to Dashboard" actions
   - AND if the API returns 0 questions, I see: "🤔 No questions found for this topic. Try a different topic!"

### Quality Requirements

10. **Performance**
    - Loading state appears within 200 ms of clicking Generate
    - If API takes > 3 s, a secondary message cycles in: "Almost there! ⏳"
    - Initial page load (LCP) < 2 seconds

11. **Accessibility**
    - All controls are keyboard-navigable (Tab, Enter/Space)
    - ARIA labels on all dropdowns, cards, and buttons
    - Focus indicators (3 px outline) visible on all interactive elements
    - Colour contrast meets WCAG 2.1 AA (4.5:1 ratio)
    - Respects `prefers-reduced-motion` — animations disabled when set

12. **Responsive Design**
    - ≥768 px: 2×2 category grid, side-by-side layout
    - <768 px: Single-column stack, full-width buttons, reduced padding

13. **Child-Friendly Design**
    - Touch targets ≥ 48×48 px (56 px preferred)
    - Font sizes: Labels 16 px, button text 18 px
    - Grade 3 reading level for all UI labels
    - Encouraging loading text and friendly error messages

---

## Technical Notes

### Component Structure

```
question-generator/
├── question-generator.ts              # Smart container component
├── question-generator.html
├── question-generator.css
├── question-generator.spec.ts
├── components/
│   └── generation-controls/
│       ├── generation-controls.ts     # Presentation component
│       ├── generation-controls.html
│       ├── generation-controls.css
│       └── generation-controls.spec.ts
├── services/
│   ├── question-generator.service.ts
│   └── question-generator.service.spec.ts
└── models/
    ├── generation-params.model.ts
    └── question.model.ts
```

### MDB 5 Components Used

- `mdb-select` — Grade dropdown, Topic dropdown
- `mdb-btn` — Generate button, difficulty toggles
- `mdb-card` — Category selector cards
- `mdb-badge` — Count badge
- `mdb-tooltip` — Hover hints on category cards

### Angular Patterns

- Standalone components (no NgModule)
- `inject()` function for DI
- Signal-based state (`signal()`, `computed()`)
- `@if` / `@for` control flow syntax
- Smart/Presentation component split

### Key Signals (Container Component)

```typescript
phase = signal<'controls' | 'questions' | 'results'>('controls');
isGenerating = signal<boolean>(false);
serviceHealthy = signal<boolean>(true);
generationParams = signal<GenerationParams | null>(null);
```

### Mock Profile Service (MVP)

Until the auth story is implemented, use a mock service returning:

```typescript
{ grade: 3, country: 'NZ' }
```

---

## Testing Requirements

### Unit Tests (Jest + Angular Testing Library)

| Test Area | Cases |
|---|---|
| Route | `/practice/generate` renders `QuestionGeneratorComponent` |
| Grade dropdown | Pre-fills from profile, options 3–8, changing grade resets topic |
| Topic dropdown | Filters by grade, shows display names, auto-selects first |
| Category cards | Renders 4 cards, single-select, default "Number Operations", selected styling |
| Difficulty toggle | 3 options, default "Easy", single-select, colour coding |
| Count slider | Range 5–25, step 5, default 10, badge updates |
| Generate button | Enabled when topic selected, disabled otherwise, loading state |
| Country | Sent in API request, falls back to NZ |
| API integration | Calls `GET /api/math-questions/generate` with correct params |
| Error handling | Error card renders on API failure, empty state on 0 results |
| Health check | Runs on init, shows error banner if unhealthy |

### Coverage Target

- **Minimum:** 85% statement coverage
- **Target:** 90%+

---

## Definition of Done

- [ ] Route `/practice/generate` registered and renders component
- [ ] Health check calls `GET /api/math-questions/health` on init
- [ ] Grade dropdown pre-filled from profile, editable (3–8)
- [ ] Topic dropdown filtered by grade with display names
- [ ] 4 category cards in 2×2 grid with single-select
- [ ] Difficulty toggle (easy/medium/hard) with colour coding
- [ ] Count slider (5–25, step 5, default 10) with badge
- [ ] Generate button enabled/disabled state correct
- [ ] Loading overlay with spinner and encouraging text
- [ ] API call to `/api/math-questions/generate` with correct params
- [ ] Error state renders friendly message with retry action
- [ ] Empty state renders when 0 questions returned
- [ ] Country sent silently from profile (fallback NZ)
- [ ] Responsive: 2×2 grid ≥768 px, single-column <768 px
- [ ] Accessibility: keyboard nav, ARIA labels, focus indicators, contrast
- [ ] Child-friendly: touch targets, font sizes, vocabulary
- [ ] Unit tests > 85% coverage
- [ ] Code review completed

---

## Dependencies

### Blockers
- Backend `GET /api/math-questions/generate` endpoint operational
- Backend `GET /api/math-questions/health` endpoint operational
- Curriculum data available (`GRADE_TOPICS`, `QUESTION_CATEGORIES`, `QUESTION_TYPE_DISPLAY_NAMES`)

### Related Stories
- **US-UI-S-009:** AI Question Display & Pagination (consumes generated questions)
- **US-UI-S-010:** Answer Collection & Batch Submission (submits answers)
- **US-UI-S-004:** Question Practice Screen (existing practice flow)

---

**Story Owner:** Frontend Team  
**Reviewers:** UX Team, Backend Team, QA Team  
**Estimated Hours:** 24–28 hours  
**Complexity:** Medium (multiple controls, API integration, responsive layout)

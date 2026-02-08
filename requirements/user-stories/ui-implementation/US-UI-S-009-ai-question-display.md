# User Story: AI Question Display & Pagination

**Story ID:** US-UI-S-009  
**Epic:** EPIC-UI-P1 (Phase 1 - MVP Core UI)  
**Priority:** P0 (Critical)  
**Story Points:** 8  
**Sprint:** MVP Sprint 2  
**Created:** February 8, 2026  
**Spec Reference:** `docs/technical/ai-question-generator-frontend-spec.md` §5, §7, §8, §9

---

## User Story

As a **student user**,  
I want **to view AI-generated questions one at a time in a paginated, LaTeX-rendered card with multiple-choice options and a text area for my notes**,  
So that **I can focus on each question, show my working, and move through the set at my own pace**.

---

## Story Context

### Existing System Integration

- **Depends on:** US-UI-S-008 (Generation Controls — provides the question array)
- **Technology:** Angular 20.x, Angular MDB 5, TypeScript, Signals, KaTeX
- **Follows pattern:** Smart/Presentation component split with `inject()` DI
- **Data model:** `GeneratedQuestion` from `api/src/app/ai/schemas.ts` (`GeneratedQuestionSchema`)
- **Touch points:**
  - `QuestionGeneratorComponent` (parent container — manages question array + navigation state)
  - `QuestionCardComponent` (renders individual question)
  - `QuestionPaginationComponent` (prev/next nav + progress bar)
  - `KatexRenderComponent` (LaTeX rendering utility)

### Screen Reference

- **Screen ID:** S1.3.2 — Phase 2 (from AI Question Generator Frontend Spec)
- **Route:** `/practice/generate` (same route, Phase 2 state)
- **Component Path:** `apps/student-app/src/app/features/practice/question-generator/components/`

---

## Acceptance Criteria

### Functional Requirements

1. **Phase Transition**
   - GIVEN the API has returned a set of generated questions (from US-UI-S-008)
   - WHEN the response is received
   - THEN the screen transitions from the Generation Controls (Phase 1) to the Question List (Phase 2)
   - AND all questions are stored in memory (pre-loaded, no lazy loading)
   - AND the first question is displayed
   - AND a session timer begins tracking total time spent

2. **Question Card Display**
   - GIVEN I am viewing a question
   - WHEN the question card renders
   - THEN I see a card (`.question-card` style) containing:
     - "📝 Question X of N" header with question counter
     - Difficulty badge (pill-shaped: green/amber/red for easy/medium/hard)
     - Question text rendered with LaTeX support (KaTeX)
     - Multiple-choice options (if applicable)
     - Textarea for additional notes
     - "💡 Show Hint" toggle button
   - AND the card has a left border using `--primary-color` (4 px)

3. **LaTeX Rendering**
   - GIVEN a question contains LaTeX expressions (e.g., `$\frac{3}{4} + \frac{1}{2}$`)
   - WHEN the question card renders
   - THEN inline LaTeX (`$...$`) and block LaTeX (`$$...$$`) are rendered via KaTeX
   - AND rendering completes in < 100 ms per question
   - AND if LaTeX parsing fails, the raw text is displayed as a fallback
   - AND a reusable `KatexRenderComponent` (or pipe) handles all LaTeX rendering

4. **Multiple-Choice Options**
   - GIVEN the question has multiple-choice options
   - WHEN the options render
   - THEN I see 4 options (A, B, C, D) in a 2×2 grid
   - AND each option has a letter badge and answer text (LaTeX-rendered)
   - AND I can select one option at a time (radio-style single-select)
   - AND the selected option shows `--primary-color` border + `#e8f0fe` background
   - AND unselected options revert to default style
   - AND options use `.option-button` style (56 px min-height, 2 px border)
   - AND a ripple/bounce animation plays on selection

5. **Textarea for Additional Notes**
   - GIVEN I am viewing a question
   - WHEN I see the textarea
   - THEN it is labelled "Additional notes (optional)"
   - AND it has 3 rows initially (auto-expandable)
   - AND it accepts up to 500 characters with a character count indicator
   - AND it uses `mdb-form-control` with `<textarea>`
   - AND my input persists when I navigate away and return to this question

6. **Paginated Navigation**
   - GIVEN I am viewing question X of N
   - WHEN I view the navigation controls
   - THEN I see:
     - "← Previous" button (disabled on question 1)
     - "Q X/N" counter in the centre
     - "Next →" button (disabled on the last question)
   - AND navigation is non-linear — I can freely move between any questions
   - AND page transitions are instant (client-side, all questions pre-loaded)

7. **Progress Bar**
   - GIVEN I am on question X of N
   - WHEN I view the progress indicator
   - THEN I see an animated `progress-bar-student` showing (X / N × 100)% completion
   - AND answered questions show a subtle ✓ badge on their progress bar segment
   - AND the progress bar uses the green→yellow gradient from the design system

8. **Answer Persistence Across Navigation**
   - GIVEN I have selected an answer and/or entered notes for a question
   - WHEN I navigate to another question and then return
   - THEN my previously selected option is still selected
   - AND my notes are still in the textarea
   - AND the hint state (expanded/collapsed) is preserved

9. **Per-Question Time Tracking**
   - GIVEN I am viewing a question
   - WHEN I navigate away from it
   - THEN the time I spent on that question is recorded in `StudentAnswer.timeSpent`
   - AND the timer resumes when I return to the same question

### Quality Requirements

10. **Performance**
    - LaTeX rendering: < 100 ms per question
    - Page navigation (prev/next): instant (client-side)
    - No layout shift when question content loads

11. **Accessibility**
    - Multiple-choice options navigable via arrow keys
    - Focus management: focus moves to question text on page change
    - Screen reader announces "Question X of N" on navigation
    - ARIA live regions for progress updates
    - Textarea has `aria-label` and character count is announced
    - Colour contrast meets WCAG 2.1 AA (4.5:1)

12. **Responsive Design**
    - ≥768 px: 2×2 multiple-choice grid, side-by-side nav buttons
    - <768 px: Single-column option stack, full-width nav buttons

13. **Child-Friendly Design**
    - Question text: 20–24 px font
    - Option text: 16–18 px font
    - Touch targets ≥ 48×48 px (56 px preferred)
    - Smooth animations on selection (bounce/pulse from design system)
    - Loading transitions use `--animation-normal` (0.3 s)

---

## Technical Notes

### Component Structure

```
question-generator/components/
├── question-card/
│   ├── question-card.ts               # Presentation component
│   ├── question-card.html
│   ├── question-card.css
│   └── question-card.spec.ts
├── question-pagination/
│   ├── question-pagination.ts         # Presentation component
│   ├── question-pagination.html
│   ├── question-pagination.css
│   └── question-pagination.spec.ts
└── katex-render/
    ├── katex-render.ts                # Utility component
    ├── katex-render.spec.ts
    └── katex-render.pipe.ts           # Pipe alternative
```

### NPM Dependencies (New)

| Package | Purpose |
|---|---|
| `katex` | LaTeX rendering engine |
| `@types/katex` | TypeScript types for KaTeX |

### MDB 5 Components Used

- `mdb-card` — Question card container
- `mdb-btn` — Previous, Next, option buttons
- `mdb-progress` — Question progress bar
- `mdb-form-control` — Textarea for notes
- `mdb-badge` — Difficulty badge, question counter

### Key Signals (Container State — from US-UI-S-008)

```typescript
questions = signal<GeneratedQuestion[]>([]);
currentIndex = signal<number>(0);
answers = signal<Map<number, StudentAnswer>>(new Map());

// Computed
currentQuestion = computed(() => this.questions()[this.currentIndex()]);
progressPercent = computed(() =>
  this.questions().length > 0
    ? (this.currentIndex() / this.questions().length) * 100
    : 0
);
```

### Question Model (from `GeneratedQuestionSchema`)

```typescript
interface GeneratedQuestion {
  question: string;           // May contain LaTeX
  answer: number;             // Correct numerical answer
  explanation: string;        // Used for hints (always present)
  metadata: {
    grade: number;
    topic: string;
    difficulty: string;       // "easy" | "medium" | "hard"
    country: Country;
    generated_by: string;
    generation_time: number;
    fallback_used?: boolean;
    validation_score?: number;
  };
}
```

### Answer Model

```typescript
interface StudentAnswer {
  questionIndex: number;
  selectedOption?: string;      // "A" | "B" | "C" | "D"
  additionalNotes?: string;
  hintUsed: boolean;
  timeSpent: number;            // seconds
}
```

---

## Testing Requirements

### Unit Tests (Jest + Angular Testing Library)

| Test Area | Cases |
|---|---|
| Phase transition | Controls hidden, question card shown after generation |
| Question card | Renders question text, difficulty badge, "Question X of N" counter |
| LaTeX rendering | Inline `$...$` rendered, block `$$...$$` rendered, raw text fallback on parse error |
| Multiple-choice | 4 options in 2×2 grid, letter badges, single-select, selected styling |
| Textarea | Renders with label, 3 rows, 500 char limit, character count |
| Pagination | Previous disabled on Q1, Next disabled on last Q, counter updates |
| Progress bar | Width matches progress %, answered questions show ✓ |
| Answer persistence | Navigate away and back — selection and notes preserved |
| Time tracking | `timeSpent` increments while viewing, pauses on navigate away |
| KatexRender | Component/pipe renders LaTeX, handles errors gracefully |

### Coverage Target

- **Minimum:** 85% statement coverage
- **Target:** 90%+

---

## Definition of Done

- [ ] Phase 2 renders when questions are loaded (Phase 1 hidden)
- [ ] Question card displays question text, difficulty badge, counter
- [ ] KaTeX integration: LaTeX expressions render correctly
- [ ] KaTeX fallback: raw text shown if parsing fails
- [ ] Multiple-choice: 2×2 grid, single-select, selected styling
- [ ] Textarea: 3 rows, 500 char limit, character count, label
- [ ] Pagination: Previous/Next buttons, disabled at boundaries
- [ ] Progress bar: animated, accurate width, ✓ badges for answered
- [ ] Non-linear navigation: answers + notes persist across pages
- [ ] Per-question time tracking functional
- [ ] Responsive: 2×2 grid ≥768 px, single-column <768 px
- [ ] Accessibility: arrow key nav, focus management, ARIA labels
- [ ] Child-friendly: font sizes, touch targets, animations
- [ ] `katex` and `@types/katex` packages installed
- [ ] Unit tests > 85% coverage
- [ ] Code review completed

---

## Dependencies

### Blockers
- **US-UI-S-008** (Generation Controls) — provides the question array
- `katex` npm package installed

### Related Stories
- **US-UI-S-008:** AI Question Generator — Generation Controls (provides questions)
- **US-UI-S-010:** Answer Collection & Batch Submission (consumes answers)
- **US-UI-S-011:** Hint Panel (reveals explanation for each question)

---

**Story Owner:** Frontend Team  
**Reviewers:** UX Team, Backend Team, QA Team  
**Estimated Hours:** 32–36 hours  
**Complexity:** High (LaTeX rendering, state management, multiple sub-components)

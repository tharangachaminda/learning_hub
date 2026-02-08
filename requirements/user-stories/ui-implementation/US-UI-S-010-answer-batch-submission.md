# User Story: Answer Collection & Batch Submission

**Story ID:** US-UI-S-010  
**Epic:** EPIC-UI-P1 (Phase 1 - MVP Core UI)  
**Priority:** P0 (Critical)  
**Story Points:** 5  
**Sprint:** MVP Sprint 2  
**Created:** February 8, 2026  
**Spec Reference:** `docs/technical/ai-question-generator-frontend-spec.md` §6, §8, §11

---

## User Story

As a **student user**,  
I want **to submit all my answers together at the end of the question set and see my results**,  
So that **I can work through questions at my own pace without pressure and then review how I did overall**.

---

## Story Context

### Existing System Integration

- **Depends on:**
  - US-UI-S-008 (Generation Controls — provides generation params)
  - US-UI-S-009 (Question Display — provides answer state)
- **Technology:** Angular 20.x, Angular MDB 5, TypeScript, Signals
- **Data model:** `StudentAnswer`, `AnswerSubmission` (from spec §6.1)
- **Scoring:** Client-side for MVP — compare `StudentAnswer` with `GeneratedQuestion.answer`
- **Touch points:**
  - `QuestionGeneratorComponent` (container — manages answers signal + submit flow)
  - `SubmitSummaryComponent` (confirmation modal + results display)

### Screen Reference

- **Screen ID:** S1.3.2 — Phase 2 → Results (from AI Question Generator Frontend Spec)
- **Route:** `/practice/generate` (same route, phase transitions to `results`)
- **Component Path:** `apps/student-app/src/app/features/practice/question-generator/components/submit-summary/`

---

## Acceptance Criteria

### Functional Requirements

1. **Submit Button Visibility**
   - GIVEN I am in the question list (Phase 2)
   - WHEN at least one question has been answered
   - THEN a "✅ Submit All Answers (X of N answered)" button appears at the bottom of the page
   - AND the button uses `.btn-success-student` style (green, `--correct-color` bg)
   - AND the button is disabled until at least 1 answer is provided
   - AND X updates in real-time as I answer more questions

2. **Submit Button — Unanswered Awareness**
   - GIVEN I have answered X out of N questions (where X < N)
   - WHEN I view the submit button
   - THEN the label clearly shows "X of N answered"
   - AND the label colour/tone indicates incomplete (not alarming — friendly)

3. **Confirmation Modal**
   - GIVEN I click the Submit button
   - WHEN the confirmation modal opens
   - THEN I see: "You've answered **X out of N** questions. Unanswered questions will be marked as skipped. Ready to submit?"
   - AND I see two buttons: `[ Cancel ]` and `[ Submit ✅ ]`
   - AND the modal uses `mdb-modal` component
   - AND pressing Cancel closes the modal and returns me to the questions
   - AND pressing Submit triggers the scoring flow

4. **Client-Side Scoring (MVP)**
   - GIVEN I confirm submission
   - WHEN the scoring runs
   - THEN each answered question is compared against `GeneratedQuestion.answer`
   - AND a result is computed: correct, incorrect, or skipped
   - AND the total score is calculated: correct count, incorrect count, skipped count
   - AND total time spent is captured from the session timer

5. **Results Summary Display**
   - GIVEN scoring is complete
   - WHEN the results screen renders (phase transitions to `results`)
   - THEN I see a summary card showing:
     - ✅ Total correct (count + percentage)
     - ❌ Total incorrect (count)
     - ⏭️ Total skipped (count)
     - ⏱️ Total time spent (formatted as mm:ss)
   - AND correct count is highlighted in green (`--correct-color`)
   - AND the card uses a celebratory animation if score ≥ 80% (pulse/bounce)
   - AND I see encouraging text appropriate to the score:
     - ≥ 80%: "🎉 Amazing work! You're a maths superstar!"
     - 50–79%: "👍 Great effort! Keep practising!"
     - < 50%: "💪 Good try! Let's practise some more!"

6. **Post-Results Actions**
   - GIVEN I am on the results screen
   - WHEN I view the action buttons
   - THEN I see:
     - "🔄 Try Again" — returns to Phase 1 (Generation Controls) with previous params pre-filled
     - "🏠 Back to Dashboard" — navigates to the student dashboard
   - AND both buttons use `.btn-student` styling

7. **Answer Submission Data Model**
   - GIVEN I submit answers
   - WHEN the submission is assembled
   - THEN the `AnswerSubmission` object contains:
     - `generationParams` (grade, topic, category, difficulty, country)
     - `answers[]` — array of `StudentAnswer` objects with: questionIndex, selectedOption, additionalNotes, hintUsed, timeSpent
     - `totalTimeSpent` (total session seconds)
     - `submittedAt` (ISO timestamp)
   - AND this data is available for future server-side persistence (not yet sent to backend)

8. **Submitting State**
   - GIVEN I confirm submission
   - WHEN scoring is in progress
   - THEN a brief loading indicator appears (even though scoring is client-side, maintain the pattern)
   - AND the submit button is disabled during processing

### Quality Requirements

9. **Performance**
    - Client-side scoring completes in < 100 ms
    - Results screen renders immediately after scoring

10. **Accessibility**
    - Modal traps focus; Escape key closes it
    - Results summary is announced by screen readers
    - Action buttons are keyboard-navigable
    - Colour-coded results have text labels (not colour-only)

11. **Responsive Design**
    - Submit button full-width on mobile (<768 px)
    - Results card centred with max-width on desktop
    - Action buttons stack on mobile

12. **Child-Friendly Design**
    - Encouraging language at all score levels
    - Celebratory animation for high scores
    - No shame/blame messaging for low scores
    - "Skipped" rather than "missed" for unanswered questions

---

## Technical Notes

### Component Structure

```
question-generator/components/
└── submit-summary/
    ├── submit-summary.ts              # Presentation component
    ├── submit-summary.html
    ├── submit-summary.css
    └── submit-summary.spec.ts
```

### MDB 5 Components Used

- `mdb-modal` — Confirmation dialog
- `mdb-btn` — Submit, Cancel, Try Again, Back to Dashboard
- `mdb-card` — Results summary card
- `mdb-badge` — Score badges

### Key Signals (Container State)

```typescript
answers = signal<Map<number, StudentAnswer>>(new Map());
isSubmitting = signal<boolean>(false);
phase = signal<'controls' | 'questions' | 'results'>('controls');

// Computed
totalAnswered = computed(() => this.answers().size);
canSubmit = computed(() => this.totalAnswered() > 0);
allAnswered = computed(() => this.totalAnswered() === this.questions().length);
```

### Data Models

```typescript
interface StudentAnswer {
  questionIndex: number;
  selectedOption?: string;       // "A" | "B" | "C" | "D"
  numericAnswer?: number;        // Future: numeric input
  textAnswer?: string;           // Future: fill-in-blank
  additionalNotes?: string;
  hintUsed: boolean;
  timeSpent: number;             // seconds
}

interface AnswerSubmission {
  generationParams: {
    grade: number;
    topic: string;
    category: string;
    difficulty: string;
    country: string;
  };
  answers: StudentAnswer[];
  totalTimeSpent: number;
  submittedAt: string;           // ISO timestamp
}

interface ScoringResult {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
  percentage: number;
  timeSpent: number;             // formatted string "mm:ss"
}
```

---

## Testing Requirements

### Unit Tests (Jest + Angular Testing Library)

| Test Area | Cases |
|---|---|
| Submit button | Hidden when 0 answered, visible when ≥1 answered, label shows "X of N" |
| Submit button | Disabled while `isSubmitting` is true |
| Confirmation modal | Opens on submit click, shows correct count text, Cancel closes, Submit triggers scoring |
| Client-side scoring | Correct answers counted, incorrect counted, skipped = total - answered |
| Results summary | Shows correct/incorrect/skipped counts and percentages |
| Results — encouraging text | ≥80%: superstar message, 50–79%: great effort, <50%: good try |
| Results — animation | Celebratory animation triggers at ≥80% |
| Try Again | Returns to Phase 1, previous params pre-filled |
| Back to Dashboard | Navigates to dashboard route |
| Data model | `AnswerSubmission` assembled with correct structure |
| Time formatting | Total time displays as mm:ss |

### Coverage Target

- **Minimum:** 85% statement coverage
- **Target:** 90%+

---

## Definition of Done

- [ ] Submit button appears when ≥1 question answered
- [ ] Submit button label shows "X of N answered" dynamically
- [ ] Submit button disabled when 0 answers or during submission
- [ ] Confirmation modal opens with correct count and messaging
- [ ] Cancel closes modal, Submit triggers scoring
- [ ] Client-side scoring correctly computes correct/incorrect/skipped
- [ ] Results screen shows score breakdown with colour coding
- [ ] Encouraging text appropriate to score level
- [ ] Celebratory animation at ≥80%
- [ ] "Try Again" returns to controls with params pre-filled
- [ ] "Back to Dashboard" navigates correctly
- [ ] `AnswerSubmission` data model assembled correctly
- [ ] Responsive: full-width on mobile, centred on desktop
- [ ] Accessibility: modal focus trap, keyboard nav, screen reader support
- [ ] Child-friendly: encouraging language, no shame messaging
- [ ] Unit tests > 85% coverage
- [ ] Code review completed

---

## Dependencies

### Blockers
- **US-UI-S-008** (Generation Controls — provides `generationParams`)
- **US-UI-S-009** (Question Display — provides `answers` signal)

### Future Dependencies (Not Blockers)
- Batch answer submission endpoint (backend — not yet built)
- Server-side persistence of results

### Related Stories
- **US-UI-S-008:** AI Question Generator — Generation Controls
- **US-UI-S-009:** AI Question Display & Pagination
- **US-UI-S-011:** Hint Panel

---

**Story Owner:** Frontend Team  
**Reviewers:** UX Team, Backend Team, QA Team  
**Estimated Hours:** 20–24 hours  
**Complexity:** Medium (client-side scoring, modal, state transitions)

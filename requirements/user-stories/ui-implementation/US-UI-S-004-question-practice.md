# User Story: Question Practice Screen

**Story ID:** US-UI-S-004  
**Epic:** EPIC-UI-P1 (Phase 1 - MVP Core UI)  
**Priority:** P0 (Critical)  
**Story Points:** 8  
**Sprint:** MVP Sprint 1  
**Created:** January 24, 2026

---

## User Story

As a **student user**,  
I want **to practice math questions with an engaging, intuitive interface that supports multiple question types**,  
So that **I can learn effectively with immediate interaction and clear progress tracking**.

---

## Story Context

### Existing System Integration

- **Integrates with:** 
  - Question generation API (`GET /api/practice/sessions/{sessionId}/questions/{index}`)
  - Answer submission API (`POST /api/practice/sessions/{sessionId}/answers`)
  - Hints API (`GET /api/practice/questions/{id}/hints`)
- **Technology:** Angular 20.x, Angular MDB 5, TypeScript, Reactive Forms
- **Follows pattern:** Component composition with smart/presentation component split
- **Touch points:** 
  - Practice service for session management
  - State management for question progression
  - Feedback modals for answer evaluation results
  - Progress tracking service

### Screen Reference

- **Screen ID:** S1.3.1 (from UI Screens Catalog)
- **Route:** `/practice/:topicId`
- **Component Path:** `apps/student-app/src/app/features/practice/question-practice/`

---

## Acceptance Criteria

### Functional Requirements

1. **Progress Header Display**
   - GIVEN I am in a practice session
   - WHEN I view the screen
   - THEN I see "Question X of 10" counter
   - AND I see a visual progress bar showing completion (0-100%)
   - AND I see the topic badge (e.g., "Addition")
   - AND I see Help and Exit buttons in the header

2. **Question Display - Multiple Choice**
   - GIVEN the current question is multiple choice
   - WHEN it loads
   - THEN I see the question text in large readable font (24px+)
   - AND I see 4 answer options (A, B, C, D) in a 2x2 grid
   - AND each option has a letter badge and answer text
   - AND a read-aloud button 🔊 is available

3. **Question Display - Numeric Input**
   - GIVEN the current question requires numeric answer
   - WHEN it loads
   - THEN I see a large text input field (read-only)
   - AND I see a virtual number keypad (0-9, backspace, clear)
   - AND my input displays in the field as I type

4. **Question Display - Fill in Blank**
   - GIVEN the current question is fill-in-the-blank
   - WHEN it loads
   - THEN I see inline text inputs or draggable chips
   - AND I can type or drag answers into blanks
   - AND blanks are clearly indicated with underscores or boxes

5. **Question Display - True/False**
   - GIVEN the current question is true/false
   - WHEN it loads
   - THEN I see two large buttons: "True ✓" and "False ✗"
   - AND buttons have clear visual distinction

6. **Visual Aid Rendering**
   - GIVEN a question includes visual aids
   - WHEN it loads
   - THEN I see relevant visualizations:
     - Number lines with highlighted values
     - Counting objects (apples, blocks) matching the problem
     - Geometry diagrams
   - AND visuals load without blocking the question display
   - AND visuals are responsive to screen size

7. **Answer Selection**
   - GIVEN I view answer options
   - WHEN I click/tap an option
   - THEN it highlights with blue background
   - AND previous selection is deselected (for single choice)
   - AND the Submit button becomes enabled
   - AND I see a ripple effect animation on tap

8. **Submit Answer**
   - GIVEN I have selected/entered an answer
   - WHEN I click "Submit Answer"
   - THEN my answer is sent to `POST /api/practice/sessions/{sessionId}/answers`
   - AND I see a loading indicator
   - AND the submit button is disabled during submission
   - AND I receive feedback within 2 seconds

9. **Progressive Hint System**
   - GIVEN I need help with a question
   - WHEN I click "Need Help?"
   - THEN a modal opens with Hint 1 (general strategy)
   - AND I can request Hint 2 (specific guidance) if needed
   - AND I can request Hint 3 (visual demonstration)
   - AND I can request Final Hint (step-by-step solution)
   - AND hint requests are tracked (but not penalized)

10. **Skip Question**
    - GIVEN I want to skip a question
    - WHEN I click "Skip Question" text link
    - THEN I move to the next question
    - AND the skip is tracked in analytics
    - AND I can return to skipped questions later (future)

11. **Question Navigation**
    - GIVEN I complete an answer (correct or incorrect)
    - WHEN feedback modal closes
    - THEN the next question loads automatically
    - AND progress bar updates to reflect new position
    - AND question content slides in from the right

12. **Read-Aloud Feature**
    - GIVEN any question is displayed
    - WHEN I click the read-aloud button 🔊
    - THEN the question text is read using text-to-speech
    - AND the button shows a "speaking" animation
    - AND I can stop playback by clicking again

### Integration Requirements

13. **API Integration - Question Loading**
    - GET `/api/practice/sessions/{sessionId}/questions/{index}` returns:
      ```json
      {
        "id": "string",
        "text": "What is 15 + 7?",
        "type": "multiple-choice" | "numeric" | "fill-blank" | "true-false",
        "options": ["20", "21", "22", "23"],
        "correctAnswer": "22",
        "visualAid": { "type": "number-line", "data": {...} },
        "difficulty": "medium"
      }
      ```
    - Questions are pre-fetched for smooth navigation
    - Offline support with cached questions

14. **API Integration - Answer Submission**
    - POST `/api/practice/sessions/{sessionId}/answers` with:
      ```json
      {
        "questionId": "string",
        "answer": "22",
        "timeSpent": 45,
        "hintsUsed": 1
      }
      ```
    - Response includes feedback data for modals
    - Submission is idempotent (can retry on failure)

15. **State Management**
    - Current session ID persisted across refreshes
    - Question index tracked in URL and state
    - Answers saved immediately (auto-save)
    - Progress persists if user navigates away

16. **Component Communication**
    - On answer submission, opens appropriate feedback modal:
      - `FeedbackCorrectComponent` for correct answers
      - `FeedbackIncorrectComponent` for incorrect answers
    - Feedback modals emit "next" event to load next question

### Quality Requirements

17. **Performance**
    - Question loads in under 2 seconds
    - Answer submission processes in under 2 seconds
    - Visual aids load progressively (don't block)
    - Smooth animations (<300ms transitions)
    - No layout shift when question loads

18. **Accessibility**
    - All interactive elements keyboard navigable
    - Focus management: answer selection via arrow keys
    - ARIA labels for all buttons and inputs
    - Screen reader announces question number and progress
    - High contrast mode supported
    - Focus indicators visible (3px outline)

19. **Responsive Design**
    - Tablet portrait (768px): 2x2 grid for multiple choice
    - Desktop (1024px+): 2x2 or 1x4 layout based on content
    - Touch targets ≥60px for children
    - Virtual keypad optimized for touch
    - Visual aids scale appropriately

20. **User Experience**
    - Smooth question transitions (slide animation)
    - Immediate visual feedback on selection
    - Loading states don't block interaction
    - Graceful error handling (retry, fallback)
    - Encouraging micro-interactions (ripples, animations)

### Testing Requirements

21. **Unit Tests**
    - Component renders each question type correctly
    - Answer selection updates state
    - Form validation (answer required before submit)
    - API service called with correct parameters
    - Hint progression logic works
    - Progress calculation accurate

22. **Integration Tests**
    - Question loading from API
    - Answer submission and response handling
    - Feedback modal integration
    - State persistence across navigation
    - Error scenarios (API failure, timeout)

23. **E2E Tests**
    - Complete practice flow: load question → select answer → submit → feedback → next question (×10)
    - Hint system: request hints → see progressive information
    - Skip question: skip → move to next
    - Multiple question types: MCQ, numeric, fill-blank, true/false

---

## Technical Notes

### MDB 5 Components Used
- `<mdb-card>` - Question container
- `<mdb-progress>` - Session progress bar
- `<mdb-btn>` - Answer options, submit, help, skip
- `<mdb-form-control>` - Numeric input field
- `<mdb-modal>` - Hints overlay
- `<mdb-tooltip>` - Read-aloud feature explanation
- `<mdb-badge>` - Topic badge, question counter

### Component Structure
```typescript
question-practice/
  ├── question-practice.component.ts       // Smart component
  ├── question-practice.component.html     // Template
  ├── question-practice.component.scss     // Styles
  ├── question-practice.component.spec.ts  // Tests
  └── components/
      ├── progress-header/                 // Reusable header
      │   ├── progress-header.component.ts
      │   ├── progress-header.component.html
      │   └── progress-header.component.scss
      ├── question-card/                   // Question display
      │   ├── question-card.component.ts
      │   ├── question-card.component.html
      │   └── question-card.component.scss
      ├── answer-options/                  // Answer UI (multiple variants)
      │   ├── multiple-choice/
      │   ├── numeric-input/
      │   ├── fill-blank/
      │   └── true-false/
      ├── virtual-keypad/                  // Numeric keypad
      │   ├── virtual-keypad.component.ts
      │   ├── virtual-keypad.component.html
      │   └── virtual-keypad.component.scss
      ├── hint-modal/                      // Hints overlay
      │   ├── hint-modal.component.ts
      │   ├── hint-modal.component.html
      │   └── hint-modal.component.scss
      └── visual-aids/                     // Visual aid renderers
          ├── number-line/
          ├── counting-objects/
          └── diagram-renderer/
```

### State Management
- Use service to manage practice session state
- Track current question index
- Maintain answers array for session
- Cache next question for performance

### Key Dependencies
- `@angular/forms` for reactive forms
- `angular-mdb` for UI components
- `rxjs` for async operations
- Practice service (`features/practice/services/practice.service`)
- Web Speech API for text-to-speech

### API Contracts
```typescript
interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'numeric' | 'fill-blank' | 'true-false';
  options?: string[];
  correctAnswer: string;
  visualAid?: VisualAid;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface AnswerSubmission {
  questionId: string;
  answer: string;
  timeSpent: number;
  hintsUsed: number;
}

interface FeedbackResponse {
  isCorrect: boolean;
  points: number;
  streak: number;
  explanation: string;
  hints?: string[];
}
```

---

## Definition of Done

- [x] Component structure created
- [ ] All question types render correctly (MCQ, numeric, fill-blank, true/false)
- [ ] Answer selection and input work for all types
- [ ] Virtual keypad functional for numeric questions
- [ ] Submit button enabled/disabled based on answer state
- [ ] Progress header shows accurate question count and progress
- [ ] API integration for question loading complete
- [ ] API integration for answer submission complete
- [ ] Feedback modals trigger on submission (integration)
- [ ] Hint modal displays progressive hints
- [ ] Skip question navigates to next
- [ ] Read-aloud feature works (text-to-speech)
- [ ] Visual aids render (number line, counting objects minimum)
- [ ] Question navigation transitions smoothly
- [ ] State persists across page refresh
- [ ] Accessibility requirements met (keyboard nav, screen readers, ARIA)
- [ ] Responsive design verified (tablet, desktop)
- [ ] Unit tests written with >80% coverage
- [ ] Integration tests pass (API mocking)
- [ ] E2E test for complete practice flow passes
- [ ] Performance requirements met (<2s load, <2s submit)
- [ ] Cross-browser testing passed
- [ ] Code review completed

---

## Dependencies

### Blockers
- Backend API endpoints operational (questions, answers, hints)
- Feedback modal components implemented (US-UI-S-005, US-UI-S-006)
- Practice service with session management
- Question models defined in shared-data

### Related Stories
- **US-UI-S-003:** Topic Selection (entry point to practice)
- **US-UI-S-005:** Feedback Modal - Correct (integration)
- **US-UI-S-006:** Feedback Modal - Incorrect (integration)
- **US-UI-S-007:** Practice Summary (exit point)
- **US-UI-SH-002:** Loading States

---

## Design Assets

Reference [ui-screens-catalog.md](../../docs/ui-screens-catalog.md) Section S1.3.1 for:
- Question card layouts for each type
- Answer option styling
- Virtual keypad design
- Hint modal UI
- Visual aid specifications
- Animation details
- Color schemes

---

**Story Owner:** Frontend Team  
**Reviewers:** UX Team, Backend Team, QA Team  
**Estimated Hours:** 60-64 hours  
**Complexity:** High (multiple question types, complex interactions)


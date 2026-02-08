# AI Question Generator — Front-End Specification

**Document Version:** 1.0  
**Created:** February 8, 2026  
**Screen Name:** AI Question Generator  
**Screen ID:** S1.3.2  
**Target App:** `student-app`  
**Route:** `/practice/generate`  
**Technology Stack:** Angular 20.x, Angular MDB 5, Bootstrap 5, TypeScript  
**Target Audience:** Students (Grades 3–8, ages 7–14)

---

## 1. Overview

### 1.1 Purpose

The AI Question Generator screen enables students to generate a set of AI-produced mathematics questions, answer them at their own pace in a paginated view, and submit all answers as a batch at the end. Questions are generated via the existing backend AI service (Ollama LLM integration) with configurable **topic**, **difficulty**, **category**, and **question count**. The student's **grade** and **country** are pre-filled from their profile but grade remains editable.

### 1.2 User Story

> As a **student user**,  
> I want **to generate a personalised set of maths questions powered by AI, answer them at my own pace, and submit them all together**,  
> So that **I can practice topics relevant to my grade level with high-quality, curriculum-aligned questions**.

### 1.3 Related Artefacts

| Artefact                            | Location                                                  |
| ----------------------------------- | --------------------------------------------------------- |
| Question Practice Screen (existing) | `US-UI-S-004-question-practice.md` — Screen S1.3.1        |
| Backend Controller                  | `api/src/app/math-questions/math-questions.controller.ts` |
| AI Schemas                          | `api/src/app/ai/schemas.ts`                               |
| Curriculum Types                    | `api/src/app/ai/curriculum.types.ts`                      |
| Question Bank JSON                  | `ai_education_questions_dataset.json`                     |
| MDB 5 Frontend Spec                 | `docs/technical/mdb5-frontend-specification.md`           |
| UI Screens Catalog                  | `docs/ui-screens-catalog.md`                              |
| Design System Variables             | `apps/student-app/src/styles.scss`                        |

---

## 2. Screen Flow

The screen is divided into **two phases**:

```
┌──────────────────────────────────────────────────────────┐
│  PHASE 1 — Generation Controls                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Grade (pre-filled, editable dropdown)              │  │
│  │ Topic (filtered by grade — auto-populated)         │  │
│  │ Category (4 categories — card-select)              │  │
│  │ Difficulty (easy / medium / hard — toggle group)   │  │
│  │ Count (slider: 5–25, default 10)                   │  │
│  │                                                    │  │
│  │        [ 🚀 Generate Questions ]                   │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│                    API Call                               │
│                         ▼                                │
│  PHASE 2 — Question List (paginated)                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Progress Bar (e.g., "Question 3 of 10")            │  │
│  │ ┌──────────────────────────────────────────────┐   │  │
│  │ │ Question Card                                │   │  │
│  │ │  • Question prompt (LaTeX rendered)          │   │  │
│  │ │  • Multiple-choice options (if applicable)   │   │  │
│  │ │  • Textarea for additional notes             │   │  │
│  │ │  • 💡 Hint toggle (reveal explanation)       │   │  │
│  │ └──────────────────────────────────────────────┘   │  │
│  │                                                    │  │
│  │  [ ← Previous ]   Q 3/10   [ Next → ]             │  │
│  │                                                    │  │
│  │           [ ✅ Submit All Answers ]                 │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1 — Generation Controls

### 3.1 Control Specifications

| Control        | Type                        | Data Source                                                                                                                                 | Behaviour                                                                                            |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Grade**      | `mdb-select` dropdown       | Pre-filled from student profile (`profile.grade`). Options: 3–8.                                                                            | Editable. Changing grade resets Topic to first available.                                            |
| **Topic**      | `mdb-select` dropdown       | Populated dynamically from `GRADE_TOPICS[grade].mathematics` via backend curriculum data. Display names from `QUESTION_TYPE_DISPLAY_NAMES`. | Filters when grade changes. First item auto-selected.                                                |
| **Category**   | Card-select (4 cards)       | `QUESTION_CATEGORIES` keys: `number-operations`, `algebra-patterns`, `geometry-measurement`, `problem-solving-reasoning`.                   | Visual card selection with icon, name, and description. Single-select. Default: `number-operations`. |
| **Difficulty** | Toggle button group         | `easy`, `medium`, `hard` (from `EnhancedDifficultyLevel` enum).                                                                             | Single-select. Default: `easy`. Visual colour coding (green / amber / red).                          |
| **Count**      | Range slider + number badge | Range 5–25, step 5. Default: 10.                                                                                                            | Badge above thumb shows current count.                                                               |
| **Country**    | Hidden                      | Auto-populated from `profile.country`. Not displayed. Sent silently in API request. Falls back to `NZ`.                                     |

### 3.2 Generate Button

- Label: **"Generate Questions"** with rocket emoji 🚀
- Style: `.btn-primary-student` (56 px height, 18 px font, `--primary-color` bg)
- Disabled state: Only enabled when a topic is selected
- Loading state: Spinner + "Generating…" label; controls disabled during request

### 3.3 Topic-to-Grade Mapping (Reference)

From `GRADE_TOPICS` in `curriculum.types.ts`:

| Grade | Topics                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3     | Addition, Subtraction, Multiplication, Division, Pattern Recognition                                                                                   |
| 4     | Addition, Subtraction, Multiplication, Division, Decimal Basics, Fraction Basics, Place Value, Pattern Recognition, Shape Properties, Time Measurement |
| 5     | Advanced Arithmetic, Algebraic Thinking, Decimal Operations, Fraction Operations, Ratio & Proportion                                                   |
| 6     | 13 topics (Large Number Ops → Mathematical Reasoning)                                                                                                  |
| 7     | 6 topics (Advanced Number Ops → Data Analysis & Probability)                                                                                           |
| 8     | 11 topics (Prime/Composite Numbers → Financial Literacy)                                                                                               |

### 3.4 Category Cards Layout

```
┌─────────────────┐  ┌─────────────────┐
│   🧮            │  │   ƒ(x)          │
│  Number Ops &   │  │  Algebra &      │
│  Arithmetic     │  │  Patterns       │
│  (selected)     │  │                 │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│   📐            │  │   🧠            │
│  Geometry &     │  │  Problem        │
│  Measurement    │  │  Solving        │
└─────────────────┘  └─────────────────┘
```

- 2×2 grid on tablet/desktop; single-column stack on mobile
- Selected card: `--primary-color` border (3 px), soft blue background (`#e8f0fe`)
- Unselected card: `--shadow-soft`, white background
- Each card shows: icon (from `CategoryInfo.icon` → Material Icon), `CategoryInfo.name`, 1-line `CategoryInfo.description`

---

## 4. API Integration

### 4.1 Generate Questions

**Endpoint:** `GET /api/math-questions/generate`

| Query Param  | Source                               | Example    |
| ------------ | ------------------------------------ | ---------- |
| `difficulty` | Mapped from selected grade: see §4.2 | `grade_3`  |
| `count`      | Count slider value                   | `10`       |
| `type`       | Selected topic, lowercased           | `addition` |

> **Note:** The current controller accepts `difficulty`, `count`, and `type` query params. The AI layer (`OllamaService.generateMathQuestion`) additionally supports `grade`, `topic`, `difficulty` (easy/medium/hard), and `country`. Future API evolution should expose these parameters directly. For the MVP, the front-end sends the existing query params and the backend maps internally.

### 4.2 Grade-to-Difficulty Mapping (MVP)

The current `DifficultyLevel` enum only has `GRADE_3`. Until the API is extended:

| Student Grade | `difficulty` param sent                      |
| ------------- | -------------------------------------------- |
| 3             | `grade_3`                                    |
| 4–8           | `grade_3` (temporary — API extension needed) |

> **TODO for Backend:** Extend `DifficultyLevel` enum and `parseDifficultyLevel()` to support grades 3–8, or expose a separate `grade` query param.

### 4.3 Hints (No Separate API Call)

The `explanation` field is **always included** in each `GeneratedQuestion` returned by the generate endpoint. Hints are rendered directly from this field — no separate `POST /api/math-questions/explain` call is needed.

> The `POST /explain` endpoint remains available for future use cases (e.g., targeted feedback after submission with the student's incorrect answer), but is **not used** by the hint system in this screen.

### 4.4 Health Check

**Endpoint:** `GET /api/math-questions/health`  
Called once on component init to verify backend availability. If unhealthy, show a friendly error banner.

---

## 5. Phase 2 — Question List (Paginated)

### 5.1 Question Response Model

Each question returned from the AI generation endpoint follows the `GeneratedQuestionSchema` defined in `api/src/app/ai/schemas.ts`:

```typescript
// From GeneratedQuestionSchema (Zod → TypeScript)
interface GeneratedQuestion {
  question: string; // Question text — may contain LaTeX
  answer: number; // Correct numerical answer
  explanation: string; // Age-appropriate explanation (always present — used for hints)
  metadata: {
    grade: number; // Grade level (1–12)
    topic: string; // Topic key (e.g., "ADDITION")
    difficulty: string; // "easy" | "medium" | "hard"
    country: Country; // "NZ" | "AU" | "UK" | "US" | "CA"
    generated_by: string; // "ollama" | "deterministic"
    generation_time: number; // ms taken to generate
    fallback_used?: boolean; // Whether deterministic fallback was used
    validation_score?: number; // 0–1 accuracy confidence score
  };
}
```

> **Note:** The `explanation` field is always included in the generated output. There is no need for a separate API call to retrieve hints — the hint system (§5.7) renders this field directly.

### 5.2 Paginated View

- **One question per page** with navigation controls
- Progress indicator: "Question X of N" + animated `progress-bar-student`
- Navigation: `[ ← Previous ]` and `[ Next → ]` buttons
- Student can freely move between questions (non-linear navigation OK)
- Answered questions show a subtle ✓ badge on the progress bar segment

### 5.3 Question Card Layout

```
┌─────────────────────────────────────────────────────────┐
│  📝 Question 3 of 10                     [easy] badge   │
│─────────────────────────────────────────────────────────│
│                                                         │
│  What is $\frac{3}{4} + \frac{1}{2}$?                  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ○ A)  $\frac{5}{4}$     ○ B)  $\frac{7}{4}$    │  │
│  │                                                   │  │
│  │  ○ C)  $\frac{1}{4}$     ○ D)  $\frac{3}{2}$    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Additional notes (optional):                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [textarea — 3 rows, expandable]                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  💡 Show Hint                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  (collapsed by default)                           │  │
│  │  "Add 3/4 and 1/2 by finding a common            │  │
│  │   denominator. 3/4 + 2/4 = 5/4"                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.4 LaTeX Rendering

- Use **KaTeX** library for client-side LaTeX rendering
- Wrap LaTeX expressions in `$...$` (inline) and `$$...$$` (block)
- Angular pipe or directive: `<span [innerHTML]="prompt | katex"></span>` or a dedicated `<app-katex>` component
- **Fallback:** If LaTeX parsing fails, render raw text
- **Package:** `katex` (npm) — lightweight, fast, no MathJax dependency

### 5.5 Multiple-Choice Support

- Displayed as a **2×2 grid** of option cards (matching S1.3.1 pattern from existing UI catalog)
- Each option: letter badge (A/B/C/D), answer text (LaTeX-rendered)
- Selection: single-select radio-style — selected option gets `--primary-color` border + `#e8f0fe` background
- Option style: `.option-button` from global styles (56 px min-height, 2 px border)

### 5.6 Textarea for Additional Notes

- Located below answer options (or below numeric input for non-multiple-choice)
- **Label:** "Additional notes (optional)"
- **Rows:** 3 (auto-expandable)
- **MDB component:** `mdb-form-control` with `<textarea>`
- **Purpose:** Student can explain reasoning, show working, or add comments
- **Max length:** 500 characters with character count indicator

### 5.7 Hint System

- **Trigger:** "💡 Show Hint" text button below textarea
- **Initial state:** Collapsed (hidden)
- **On click:** Expands with a slide-down animation (`--animation-normal: 0.3s`)
- **Hint source:** `explanation` field from the `GeneratedQuestion` — always present, no API call needed
- **Visual style:** Light yellow background (`#fffde7`), left border `--accent-color`, rounded corners, hint icon
- **Toggle text:** Changes to "💡 Hide Hint" when expanded

---

## 6. Answer Collection & Batch Submission

### 6.1 Answer State Model

```typescript
interface StudentAnswer {
  questionIndex: number; // 0-based index in the question list
  question_id: string; // Matches generated question ID
  selectedOption?: string; // For multiple-choice: "A" | "B" | "C" | "D"
  numericAnswer?: number; // For numeric input questions
  textAnswer?: string; // For fill-in-blank or free text
  additionalNotes?: string; // From the textarea
  hintUsed: boolean; // Whether hint was revealed
  timeSpent: number; // Seconds spent on this question
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
  totalTimeSpent: number; // Total session time in seconds
  submittedAt: string; // ISO timestamp
}
```

### 6.2 Submit Button

- Appears at the **bottom of every page** once at least one question has been answered
- **Label:** "✅ Submit All Answers (X of N answered)"
- **Style:** `.btn-success-student` (green, `--correct-color` bg)
- **Disabled state:** Disabled until at least 1 answer is provided
- **Confirmation:** Modal dialog before submission:
  > "You've answered **X out of N** questions. Unanswered questions will be marked as skipped. Ready to submit?"  
  > `[ Cancel ]` `[ Submit ✅ ]`

### 6.3 Post-Submission

- After successful submission, navigate to a **Results Summary** view (can be an inline section or separate route)
- Show: total correct, total incorrect, total skipped, time spent
- Offer: "🔄 Try Again" (re-generate) and "🏠 Back to Dashboard"

> **Note:** The results/scoring API endpoint is not yet built. For the MVP, scoring can happen client-side by comparing `StudentAnswer` with the question's `answer` field.

---

## 7. Component Architecture

### 7.1 File Structure

```
apps/student-app/src/app/features/practice/
├── question-generator/
│   ├── question-generator.ts              # Smart container component
│   ├── question-generator.html            # Template
│   ├── question-generator.css             # Scoped styles
│   ├── question-generator.spec.ts         # Unit tests
│   │
│   ├── components/                        # Presentation components
│   │   ├── generation-controls/
│   │   │   ├── generation-controls.ts
│   │   │   ├── generation-controls.html
│   │   │   ├── generation-controls.css
│   │   │   └── generation-controls.spec.ts
│   │   │
│   │   ├── question-card/
│   │   │   ├── question-card.ts
│   │   │   ├── question-card.html
│   │   │   ├── question-card.css
│   │   │   └── question-card.spec.ts
│   │   │
│   │   ├── question-pagination/
│   │   │   ├── question-pagination.ts
│   │   │   ├── question-pagination.html
│   │   │   ├── question-pagination.css
│   │   │   └── question-pagination.spec.ts
│   │   │
│   │   ├── hint-panel/
│   │   │   ├── hint-panel.ts
│   │   │   ├── hint-panel.html
│   │   │   ├── hint-panel.css
│   │   │   └── hint-panel.spec.ts
│   │   │
│   │   ├── submit-summary/
│   │   │   ├── submit-summary.ts
│   │   │   ├── submit-summary.html
│   │   │   ├── submit-summary.css
│   │   │   └── submit-summary.spec.ts
│   │   │
│   │   └── katex-render/
│   │       ├── katex-render.ts            # Reusable LaTeX renderer
│   │       ├── katex-render.spec.ts
│   │       └── katex-render.pipe.ts       # Pipe alternative
│   │
│   ├── services/
│   │   ├── question-generator.service.ts  # API integration
│   │   └── question-generator.service.spec.ts
│   │
│   └── models/
│       ├── generation-params.model.ts     # Interfaces for controls
│       ├── student-answer.model.ts        # Answer state interfaces
│       └── question.model.ts              # Question response model
```

### 7.2 Component Responsibilities

| Component                     | Type              | Responsibility                                                                 |
| ----------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `QuestionGeneratorComponent`  | Smart (Container) | Orchestrates Phase 1 → Phase 2 flow, manages state, calls service              |
| `GenerationControlsComponent` | Presentation      | Renders grade/topic/category/difficulty/count controls, emits `generate` event |
| `QuestionCardComponent`       | Presentation      | Renders single question with LaTeX, options, textarea, hint toggle             |
| `QuestionPaginationComponent` | Presentation      | Previous/Next nav, progress bar, question counter                              |
| `HintPanelComponent`          | Presentation      | Collapsible hint display, optional "Need more help?" trigger                   |
| `SubmitSummaryComponent`      | Presentation      | Confirmation modal, results display                                            |
| `KatexRenderComponent`        | Utility           | Wraps KaTeX rendering as a reusable component/pipe                             |
| `QuestionGeneratorService`    | Service           | HTTP calls to `/api/math-questions/*` endpoints                                |

### 7.3 Angular Patterns

- **Standalone components** (no NgModule)
- **`inject()` function** for DI (no constructor injection)
- **Signal-based state** where applicable (Angular 20.x signals)
- **Reactive Forms** for answer collection
- **`@if` / `@for`** control flow syntax (new Angular template syntax)
- **Smart/Presentation component split** (container manages data; children receive via `@Input`, emit via `@Output`)

---

## 8. State Management

### 8.1 Component State (Signal-based)

```typescript
// QuestionGeneratorComponent — signals
phase = signal<'controls' | 'questions' | 'results'>('controls');
questions = signal<GeneratedQuestion[]>([]);
currentIndex = signal<number>(0);
answers = signal<Map<number, StudentAnswer>>(new Map());
isGenerating = signal<boolean>(false);
isSubmitting = signal<boolean>(false);
generationParams = signal<GenerationParams | null>(null);
serviceHealthy = signal<boolean>(true);
sessionStartTime = signal<number>(0);
```

### 8.2 Computed Properties

```typescript
currentQuestion = computed(() => this.questions()[this.currentIndex()]);
totalAnswered = computed(() => this.answers().size);
progressPercent = computed(() => (this.questions().length > 0 ? (this.currentIndex() / this.questions().length) * 100 : 0));
canSubmit = computed(() => this.totalAnswered() > 0);
allAnswered = computed(() => this.totalAnswered() === this.questions().length);
```

---

## 9. Accessibility & Child-Friendliness

### 9.1 WCAG 2.1 AA Compliance

| Requirement         | Implementation                                                  |
| ------------------- | --------------------------------------------------------------- |
| Colour contrast     | All text meets 4.5:1 ratio (dark text on light backgrounds)     |
| Focus indicators    | Visible 3 px focus ring on all interactive elements             |
| Keyboard navigation | Full tab-order support; Enter/Space to select options           |
| Screen reader       | ARIA labels on all controls; live regions for progress updates  |
| Motion              | Respects `prefers-reduced-motion`; animations disabled when set |

### 9.2 Child-Friendly Design

| Principle           | Implementation                                                                  |
| ------------------- | ------------------------------------------------------------------------------- |
| **Touch targets**   | Minimum 48×48 px (56 px preferred per design system)                            |
| **Font sizes**      | Question text: 20–24 px; options: 16–18 px; labels: 16 px                       |
| **Vocabulary**      | Grade 3 reading level for all UI labels                                         |
| **Visual feedback** | Bounce/pulse animations on selection; colour transitions                        |
| **Error messaging** | Friendly language: "Oops! Let's try that again 😊"                              |
| **Loading states**  | Animated mascot or spinner with encouraging text: "Creating your questions… 🎨" |

### 9.3 Responsive Breakpoints

| Breakpoint                   | Layout                                                   |
| ---------------------------- | -------------------------------------------------------- |
| **≥768 px** (Tablet/Desktop) | 2×2 category grid; side-by-side navigation buttons       |
| **<768 px** (Mobile)         | Single-column stack; full-width buttons; reduced padding |

---

## 10. Design Tokens & Styling

### 10.1 CSS Variables (from `styles.scss`)

```css
--primary-color: #4285f4; /* Interactive elements, selected states */
--secondary-color: #34a853; /* Success, correct, submit button */
--accent-color: #fbbc04; /* Hints, badges, attention */
--warning-color: #ea4335; /* Errors, hard difficulty */
--bg-primary: #f8f9fa; /* Page background */
--bg-card: #ffffff; /* Card background */
--border-radius: 16px; /* Rounded corners */
--shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.15);
--animation-fast: 0.2s;
--animation-normal: 0.3s;
--animation-slow: 0.5s;
```

### 10.2 Difficulty Colour Coding

| Difficulty | Colour                        | Badge Style      |
| ---------- | ----------------------------- | ---------------- |
| Easy       | `--secondary-color` (#34a853) | Green pill badge |
| Medium     | `--accent-color` (#fbbc04)    | Amber pill badge |
| Hard       | `--warning-color` (#ea4335)   | Red pill badge   |

### 10.3 MDB 5 Components Used

| Component          | Usage                                         |
| ------------------ | --------------------------------------------- |
| `mdb-select`       | Grade dropdown, Topic dropdown                |
| `mdb-btn`          | Generate, Previous, Next, Submit, Hint toggle |
| `mdb-card`         | Category selector cards, Question card        |
| `mdb-progress`     | Question progress bar                         |
| `mdb-modal`        | Submit confirmation dialog                    |
| `mdb-form-control` | Textarea for notes                            |
| `mdb-badge`        | Difficulty badge, question counter            |
| `mdb-tooltip`      | Hover hints on category cards                 |

---

## 11. Screen States

### 11.1 State Diagram

```
                    ┌────────────┐
                    │   INIT     │  ← Health check + load profile
                    └─────┬──────┘
                          │
                          ▼
                    ┌────────────┐
                    │  CONTROLS  │  ← Phase 1: user configures generation
                    └─────┬──────┘
                          │ Generate clicked
                          ▼
                    ┌────────────┐
                    │  LOADING   │  ← Spinner, "Creating your questions…"
                    └─────┬──────┘
                          │ API response
                     ┌────┴────┐
                     ▼         ▼
               ┌──────────┐ ┌───────┐
               │ QUESTIONS │ │ ERROR │  ← Friendly retry message
               └─────┬────┘ └───────┘
                     │ Submit clicked + confirmed
                     ▼
               ┌──────────┐
               │ RESULTS  │  ← Score summary, try again / dashboard
               └──────────┘
```

### 11.2 Loading State

- Full-page overlay with semi-transparent background
- Centred card with animated spinner (or custom mascot animation)
- Text: "🎨 Creating your questions…" → cycles to "Almost there! ⏳" after 2 s
- Performance budget: < 3 s (per backend requirement)

### 11.3 Error State

- Friendly card: "😅 Oops! Something went wrong"
- Sub-text: "We couldn't generate your questions right now. Let's try again!"
- Primary action: `[ 🔄 Try Again ]`
- Secondary action: `[ 🏠 Back to Dashboard ]`

### 11.4 Empty State

- If the API returns 0 questions (edge case): "🤔 No questions found for this topic. Try a different topic!"

---

## 12. Performance Requirements

| Metric                      | Target                | Source                                           |
| --------------------------- | --------------------- | ------------------------------------------------ |
| Question generation (API)   | < 3 seconds           | Backend performance requirement                  |
| Hint reveal (client-side)   | Instant               | No API call — `explanation` field already loaded |
| LaTeX rendering (client)    | < 100 ms per question | KaTeX benchmark                                  |
| Page navigation (prev/next) | Instant (client-side) | All questions pre-loaded                         |
| Initial page load (LCP)     | < 2 seconds           | Web Vitals target                                |

---

## 13. Testing Strategy

### 13.1 Unit Tests (Jest + Angular Testing Library)

| Area                          | Tests                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `GenerationControlsComponent` | Grade dropdown renders, topic filters by grade, category card selection, difficulty toggle, count slider, generate button enabled/disabled |
| `QuestionCardComponent`       | Renders prompt text, LaTeX rendering, multiple-choice 2×2 grid, radio selection, textarea input, hint toggle expand/collapse               |
| `QuestionPaginationComponent` | Previous/Next button states, progress bar width, question counter text, boundary conditions (first/last question)                          |
| `HintPanelComponent`          | Collapsed by default, expands on click, shows explanation text from `GeneratedQuestion.explanation`                                        |
| `SubmitSummaryComponent`      | Shows answered count, confirmation modal, results display                                                                                  |
| `QuestionGeneratorComponent`  | Phase transitions, API call triggers, answer collection, submit flow                                                                       |
| `QuestionGeneratorService`    | HTTP calls mocked, error handling, response mapping                                                                                        |

### 13.2 Coverage Target

- **Minimum:** 85% statement coverage (per project DoD)
- **Target:** 90%+ for all components

### 13.3 E2E Tests (Playwright)

- Generate 5 questions → answer all → submit → verify results
- Change grade → verify topic dropdown updates
- Reveal hint → verify hint text visible
- Submit with unanswered questions → verify confirmation modal

---

## 14. Dependencies & Prerequisites

### 14.1 NPM Packages

| Package        | Purpose          | Status         |
| -------------- | ---------------- | -------------- |
| `katex`        | LaTeX rendering  | **To install** |
| `@types/katex` | TypeScript types | **To install** |

### 14.2 Backend Prerequisites

| Item                                  | Status     | Notes                                                                                                         |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `GET /api/math-questions/generate`    | ✅ Exists  | Only supports `grade_3` difficulty currently                                                                  |
| `POST /api/math-questions/explain`    | ✅ Exists  | Not used for hints (explanation included in generated output). Available for future post-submission feedback. |
| `GET /api/math-questions/health`      | ✅ Exists  | Returns capabilities object                                                                                   |
| Multi-grade `DifficultyLevel` support | ❌ Not yet | Extend enum for grades 3–8                                                                                    |
| Batch answer submission endpoint      | ❌ Not yet | New endpoint needed for results/scoring                                                                       |
| Student profile service               | ❌ Not yet | Needed to pre-fill grade/country                                                                              |

### 14.3 Shared Data

- `GRADE_TOPICS`, `QUESTION_CATEGORIES`, `QUESTION_TYPE_DISPLAY_NAMES` from `curriculum.types.ts` should be exposed via a shared API endpoint or published in the `shared-data` library for front-end consumption

---

## 15. Open Questions & Future Considerations

| #   | Question                                                                                             | Proposed Resolution                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The backend `DifficultyLevel` enum only has `GRADE_3`. How to handle grades 4–8?                     | Extend backend enum. Short-term: map all grades to `grade_3` and use AI difficulty (easy/medium/hard) as the real differentiator.     |
| 2   | Where do multiple-choice options come from? The current question model has only `prompt` + `answer`. | Either: (a) backend generates distractors via LLM, or (b) front-end generates plausible wrong answers algorithmically. Recommend (a). |
| 3   | Should answers be persisted server-side or only client-side for MVP?                                 | Client-side scoring for MVP. Server-side persistence in a follow-up story.                                                            |
| 4   | How is the student profile loaded? No auth/profile module exists yet.                                | For MVP, use a mock profile service with hardcoded grade/country. Replace when auth story is implemented.                             |
| 5   | Should the question count be limited by what the AI can generate in < 3 s?                           | Yes. Backend already caps at 50. Front-end caps at 25 for UX.                                                                         |
| 6   | Should we support question types beyond multiple-choice in the generator?                            | Defer to future story. MVP supports multiple-choice only from the generator. Numeric/fill-in-blank support later.                     |

---

## 16. Revision History

| Version | Date       | Author            | Changes               |
| ------- | ---------- | ----------------- | --------------------- |
| 1.0     | 2026-02-08 | Sally (UX Expert) | Initial specification |

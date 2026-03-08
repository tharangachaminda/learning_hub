# User Story: LaTeX Math Expression Support in Question Generation

**Story ID:** US-QG-011  
**Epic:** Full-Grade Question Generation & Management  
**Priority:** P0 (Critical)  
**Story Points:** 5  
**Sprint:** TBD

## User Story

```
As a student
I want math expressions in questions, options, and explanations rendered with proper mathematical notation
So that I can read and understand mathematical content clearly (fractions, exponents, roots, etc.)
```

## Context

The frontend (student-app) already uses **KaTeX** to render LaTeX math expressions. The `KatexRenderComponent` parses `$...$` for inline math and `$$...$$` for display math in mixed text content. The backend needs to generate question content with LaTeX-formatted math expressions so the frontend renders them correctly.

**Approach:** Instruct the LLM to generate math expressions directly in LaTeX format within its responses. This is preferred over post-generation conversion because:

- LLMs already produce high-quality LaTeX
- Avoids fragile plain-text-to-LaTeX parsing
- Simpler pipeline with no extra processing step

## Acceptance Criteria

### Functional Requirements

- [ ] **AC-001:** All math expressions in generated question text use LaTeX notation wrapped in `$...$` (inline) or `$$...$$` (display)
- [ ] **AC-002:** MCQ options containing math use LaTeX (e.g. `$\frac{3}{4}$` instead of `3/4`)
- [ ] **AC-003:** Step-by-step solutions and explanations use LaTeX for all math expressions
- [ ] **AC-004:** Non-math narrative text remains as plain text (not wrapped in LaTeX delimiters)
- [ ] **AC-005:** Generated LaTeX is valid and renderable by KaTeX (no unsupported commands)
- [ ] **AC-006:** Simple arithmetic (e.g. `5 + 3`) uses LaTeX just as complex expressions do, for rendering consistency
- [ ] **AC-007:** Works across all grades, topics, and question formats (open-answer, MCQ, fill-in-blank, word problem, drag-drop)

### Technical Requirements

- **REQ-QG-044:** Update AI system prompt to instruct the LLM to use `$...$` for inline math and `$$...$$` for display math in all generated content
- **REQ-QG-045:** Include a LaTeX style guide in the prompt specifying: use `\frac{}{}` for fractions, `\times` for multiplication, `\div` for division, `^{}` for exponents, `\sqrt{}` for roots, `\text{}` for units inside math mode
- **REQ-QG-046:** Add post-generation LaTeX validation step that checks generated content is KaTeX-compatible (using KaTeX's `renderToString` with `throwOnError: true` or a lightweight check)
- **REQ-QG-047:** Store LaTeX content as-is in MongoDB (the `questionText`, `options`, `explanation`, and `stepByStepSolution` fields all contain LaTeX)
- **REQ-QG-048:** If LaTeX validation fails, flag the question for manual review (set status to `pending_review` or log a warning)

## Definition of Done

- [ ] AI prompt includes clear LaTeX formatting instructions
- [ ] Generated questions use `$...$` / `$$...$$` delimiters for all math
- [ ] LaTeX renders correctly in the student-app's `KatexRenderComponent`
- [ ] MCQ options, explanations, and step-by-step solutions all use LaTeX
- [ ] Post-generation LaTeX validation catches malformed expressions
- [ ] Unit tests verify LaTeX presence in generated content
- [ ] Integration test confirms end-to-end: generate → store → serve → render

## Dependencies

- US-QG-003 / SCRUM-42 (Grade support — LaTeX applies to all grades)
- Frontend `KatexRenderComponent` already in place (no frontend changes needed)

## Technical Implementation Notes

### Prompt Engineering

Add to the AI system prompt (in `ollama.service.ts` or `curriculum-prompt-engine.ts`):

```
FORMATTING RULES:
- Wrap ALL math expressions in LaTeX delimiters: $...$ for inline, $$...$$ for display
- Use LaTeX commands: \frac{a}{b} for fractions, \times for multiplication, \div for division, ^ for exponents, \sqrt{} for roots
- Use \text{} for units inside math: $5 \text{ cm}$
- Keep narrative/instructional text as plain text outside delimiters
- Example: "What is $\frac{3}{4} + \frac{1}{2}$?" NOT "What is 3/4 + 1/2?"
- Example: "Solve: $$2x + 5 = 15$$" for display-mode equations
```

### Validation

- Use a lightweight KaTeX parse check (server-side) or regex validation for common LaTeX patterns
- Questions that fail validation get stored with a `latexValid: false` flag for admin review

### Key Files

- `api/src/app/ai/ollama.service.ts` — add LaTeX instructions to prompts
- `api/src/app/ai/curriculum-prompt-engine.ts` — include LaTeX style guide in system prompt
- `api/src/app/ai/schemas.ts` — no schema change needed (LaTeX is embedded in existing string fields)
- `api/src/app/math-questions/services/math-question-generator.service.ts` — add optional validation step

## Testing Scenarios

### Scenario 1: Simple Arithmetic with LaTeX

```gherkin
Given I request a Grade 3 ADDITION question
When the AI generates the question
Then the question text should contain LaTeX like "What is $15 + 8$?"
And the explanation should use LaTeX like "$15 + 8 = 23$"
```

### Scenario 2: Fraction Question with LaTeX

```gherkin
Given I request a Grade 5 FRACTION_OPERATIONS question
When the AI generates the question
Then the question should use \frac notation like "Simplify $\frac{6}{8}$"
And NOT plain text like "Simplify 6/8"
```

### Scenario 3: MCQ Options with LaTeX

```gherkin
Given I request an MCQ question for Grade 6 ALGEBRAIC_EQUATIONS
When the AI generates options
Then each option should use LaTeX: "$x = 5$", "$x = 3$", "$x = -2$", "$x = 7$"
And NOT plain text: "x = 5", "x = 3"
```

### Scenario 4: Word Problem with Mixed Content

```gherkin
Given I request a word problem for Grade 4 MULTIPLICATION
When the AI generates the narrative
Then narrative text should be plain: "Emma bought 4 packs of stickers."
And math should be LaTeX: "Each pack has $12$ stickers. How many stickers in total? $$4 \times 12 = ?$$"
```

### Scenario 5: LaTeX Validation

```gherkin
Given the AI generates a question with malformed LaTeX like "$\frac{3}{$"
When the post-generation validation runs
Then the question should be flagged with latexValid = false
And stored with status "pending" for manual review
```

## Success Metrics

- 100% of math expressions in generated content use LaTeX delimiters
- LaTeX validation pass rate > 95% (LLM produces valid LaTeX most of the time)
- Frontend renders all served questions without KaTeX errors
- No plain-text math expressions in approved questions

## Notes

- KaTeX is stricter than full LaTeX — avoid commands like `\begin{align}` (use `\begin{aligned}` instead)
- The existing `ai_education_questions_dataset.json` contains ~23K questions in plain text; a separate migration task may be needed to convert those to LaTeX if they are loaded as seed data
- LaTeX content is stored as strings in MongoDB — no special encoding needed

# Decision: Skip LaTeX Update for createEnhancedCurriculumPrompt()

## Decision ID: DEC-001

## Date: 2026-03-08

## Work Item: TN-FEATURE-SCRUM-50-LATEX-SUPPORT-FOR-QUESTION-GENERATOR

## Context

During Task 2 analysis, discovered that `OllamaService.createEnhancedCurriculumPrompt()` (line 203) is **dead code** — it is defined but never called anywhere in the codebase. The actual question generation in `generateMathQuestion()` uses `this.curriculumPromptEngine.generateCurriculumPrompt()` which was already updated in Task 1.

## Alternatives Considered

1. **Add LaTeX rules to dead code anyway** — Overhead with no benefit, adds maintenance burden to unused code
2. **Skip it entirely** — ✅ Chosen. Focus on code that's actually executed
3. **Delete the dead code** — Out of scope for this story

## Decision

Skip Task 2. Do NOT add LaTeX formatting rules to `createEnhancedCurriculumPrompt()` since it's dead code. If it becomes active in the future, LaTeX rules should be added at that time.

## Impact

- No risk: the method is not in any execution path
- Story acceptance criteria unaffected — all active prompt generation paths will have LaTeX rules

# User Story: Extend Grade Support to Grades 3–8

**Story ID:** US-QG-003  
**Epic:** Full-Grade Question Generation & Management  
**Priority:** P0 (Critical)  
**Story Points:** 5  
**Sprint:** TBD

## User Story

```
As a student in grades 3–8
I want the system to generate math questions for my grade level
So that I receive age-appropriate questions aligned with my curriculum
```

## Acceptance Criteria

### Functional Requirements

- [x] **AC-001:** The `GET /generate` endpoint accepts `difficulty` values `grade_3` through `grade_8`
- [x] **AC-002:** Requesting `difficulty=grade_5` returns questions scoped to Grade 5 curriculum
- [x] **AC-003:** AI prompts include the correct NZ curriculum level mapping for each grade (Grades 3–4 → Level 2, Grades 5–6 → Level 3, Grades 7–8 → Level 4)
- [x] **AC-004:** Invalid grades (e.g. `grade_2`, `grade_9`) return a 400 error with a clear message
- [x] **AC-005:** Question generation completes within 3 seconds for any grade

### Technical Requirements

- **REQ-QG-010:** `DifficultyLevel` enum expanded to include `GRADE_3` through `GRADE_8`
- **REQ-QG-011:** `GRADE_LEVEL_PATTERNS` in schemas has entries for grades 3–8
- **REQ-QG-012:** Controller's `parseDifficultyLevel()` and `difficultyToGrade()` handle all 6 grades
- **REQ-QG-013:** Curriculum prompt engine maps each grade to the correct NZ curriculum level

## Definition of Done

- [x] `DifficultyLevel` enum includes values for grades 3–8
- [x] Controller validates and routes all 6 grade levels
- [x] AI prompt includes correct curriculum level context per grade
- [x] Unit tests cover all grade parsing and mapping functions
- [x] Integration test confirms question generation for each grade
- [x] Invalid grade inputs return proper error responses

## Dependencies

- Ollama LLM service running with llama3.1 model

## Technical Implementation Notes

- Extend `DifficultyLevel` enum in `math-question.entity.ts` with `GRADE_4` through `GRADE_8`
- Update `parseDifficultyLevel()` and `difficultyToGrade()` in the controller to handle all grades
- Add `GRADE_LEVEL_PATTERNS` entries in `schemas.ts` for grades 4–8
- Curriculum prompt engine already maps grades to NZ curriculum levels — verify it works for all 6

## Testing Scenarios

### Scenario 1: Generate Grade 5 Questions

```gherkin
Given I am a Grade 5 student
When I request questions with difficulty "grade_5"
Then I should receive questions aligned with NZ Curriculum Level 3
And the questions should be appropriate for Grade 5 complexity
```

### Scenario 2: Invalid Grade Handling

```gherkin
Given I request questions with difficulty "grade_9"
When the system processes my request
Then I should receive a 400 Bad Request error
And the error message should list valid grade options
```

## Success Metrics

- Questions generated successfully for all 6 grades (3–8)
- Generation latency < 3 seconds for each grade
- 100% mathematical accuracy across all grades
- Correct curriculum level mapping verified per grade

---

## Dev Agent Record

**Status:** Ready for Review  
**Agent Model Used:** Claude Opus 4.6  
**Session Log:** `dev_mmdd_logs/sessions/TN-FEATURE-SCRUM-42-EXTEND-GRADE-SUPPORT/2026-03-08-session-1.md`  
**Branch:** `feature/SCRUM-42-extend-grade-support`

### Debug Log References

- No blocking issues encountered during implementation

### Completion Notes

- All 5 TDD micro-steps completed with strict Red-Green-Refactor discipline
- 69 new tests added (4 entity + 14 controller + 49 schemas + 2 ollama)
- Total relevant tests: 126 passing, 0 regressions
- Coverage ≥80% on all modified files (entity 100%, controller 96.87%, schemas 93.75%)
- Bonus: Fixed hardcoded `GRADE_LEVEL_PATTERNS.GRADE_3` in ollama.service.ts → dynamic `getGradePatterns(grade)`
- Bonus: Created `getGradePatterns()` helper for grade-to-pattern lookup with clamping

### File List

| File | Action | Description |
|------|--------|-------------|
| `api/src/app/math-questions/entities/math-question.entity.ts` | Modified | Added GRADE_4–GRADE_8 to DifficultyLevel enum |
| `api/src/app/math-questions/entities/math-question.entity.spec.ts` | Modified | +4 tests for multi-grade enum |
| `api/src/app/math-questions/math-questions.controller.ts` | Modified | Updated parseDifficultyLevel() + difficultyToGrade() for grades 3–8 |
| `api/src/app/math-questions/math-questions.controller.spec.ts` | Modified | +14 tests (parse, map, invalid grades, health check) |
| `api/src/app/ai/schemas.ts` | Modified | Added GRADE_LEVEL_PATTERNS for grades 4–8 + getGradePatterns() helper |
| `api/src/app/ai/schemas.spec.ts` | Created | 49 tests for grade patterns, helper, country context, LLM parsing |
| `api/src/app/ai/ollama.service.ts` | Modified | Dynamic grade pattern lookup via getGradePatterns() |
| `api/src/app/ai/ollama.service.spec.ts` | Modified | +2 tests for grade-specific explanation patterns |

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-08 | Added GRADE_4–GRADE_8 to DifficultyLevel enum | AC-001: Support grades 3–8 |
| 2026-03-08 | Updated parseDifficultyLevel() with grade_4–grade_8 cases | AC-001: Parse all grade inputs |
| 2026-03-08 | Updated difficultyToGrade() with grade 4–8 mappings | AC-003: Correct grade number for curriculum lookup |
| 2026-03-08 | Added GRADE_LEVEL_PATTERNS for grades 4–8 | REQ-QG-011: Age-appropriate vocabulary per grade |
| 2026-03-08 | Created getGradePatterns() helper | Refactor: Dynamic grade-to-pattern lookup |
| 2026-03-08 | Fixed ollama.service.ts hardcoded GRADE_3 | Refactor: Use dynamic grade patterns |

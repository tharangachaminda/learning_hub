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

- [ ] **AC-001:** The `GET /generate` endpoint accepts `difficulty` values `grade_3` through `grade_8`
- [ ] **AC-002:** Requesting `difficulty=grade_5` returns questions scoped to Grade 5 curriculum
- [ ] **AC-003:** AI prompts include the correct NZ curriculum level mapping for each grade (Grades 3–4 → Level 2, Grades 5–6 → Level 3, Grades 7–8 → Level 4)
- [ ] **AC-004:** Invalid grades (e.g. `grade_2`, `grade_9`) return a 400 error with a clear message
- [ ] **AC-005:** Question generation completes within 3 seconds for any grade

### Technical Requirements

- **REQ-QG-010:** `DifficultyLevel` enum expanded to include `GRADE_3` through `GRADE_8`
- **REQ-QG-011:** `GRADE_LEVEL_PATTERNS` in schemas has entries for grades 3–8
- **REQ-QG-012:** Controller's `parseDifficultyLevel()` and `difficultyToGrade()` handle all 6 grades
- **REQ-QG-013:** Curriculum prompt engine maps each grade to the correct NZ curriculum level

## Definition of Done

- [ ] `DifficultyLevel` enum includes values for grades 3–8
- [ ] Controller validates and routes all 6 grade levels
- [ ] AI prompt includes correct curriculum level context per grade
- [ ] Unit tests cover all grade parsing and mapping functions
- [ ] Integration test confirms question generation for each grade
- [ ] Invalid grade inputs return proper error responses

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

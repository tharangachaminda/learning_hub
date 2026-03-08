# User Story: Support Multiple-Choice Question Format

**Story ID:** US-QG-007  
**Epic:** Full-Grade Question Generation & Management  
**Priority:** P1 (High)  
**Story Points:** 5  
**Sprint:** TBD

## User Story

```
As a student
I want some questions presented as multiple-choice
So that I can learn by evaluating options rather than always computing from scratch
```

## Acceptance Criteria

### Functional Requirements

- [ ] **AC-001:** The generate endpoint accepts `format=mcq` parameter
- [ ] **AC-002:** MCQ responses include 4 options with exactly 1 correct answer
- [ ] **AC-003:** Distractors (incorrect options) are plausible — based on common mistakes, not random numbers
- [ ] **AC-004:** Correct answer position is randomized across options A–D
- [ ] **AC-005:** Default format remains `open-answer` if the parameter is omitted
- [ ] **AC-006:** MCQ format works across all grades and topics

### Technical Requirements

- **REQ-QG-030:** Add `questionFormat` parameter to the generate endpoint (`open-answer | mcq`)
- **REQ-QG-031:** AI prompt instructs the LLM to generate plausible distractors based on common mathematical errors
- **REQ-QG-032:** Response schema includes `options` array and `correctOptionIndex` fields
- **REQ-QG-033:** Validate that exactly 4 options are returned with one correct answer

## Definition of Done

- [ ] MCQ generation works for all grades and topics
- [ ] 4 options returned per question with randomized correct answer placement
- [ ] Distractors are pedagogically appropriate (common errors, not random)
- [ ] Unit tests verify MCQ structure and validation
- [ ] Integration test confirms LLM generates valid MCQ responses

## Dependencies

- US-QG-004 (All math topics enabled)
- US-QG-011 / SCRUM-50 (LaTeX support — MCQ options must use LaTeX for math expressions)

## Technical Implementation Notes

- Extend the AI prompt in `ollama.service.ts` to request MCQ format with distractor generation instructions
- Add `options?: string[]` and `correctOptionIndex?: number` to the question entity/schema
- Add `format` field to the Zod validation schemas
- Distractor strategy: instruct LLM to use common errors (e.g. off-by-one, wrong operation, place value mistakes)

## Testing Scenarios

### Scenario 1: MCQ Generation

```gherkin
Given I request an MCQ question for Grade 3 ADDITION
When the AI generates the question "What is 15 + 8?"
Then I should receive 4 options like: A) 21, B) 23, C) 25, D) 13
And the correct answer index should point to B) 23
```

### Scenario 2: Randomized Placement

```gherkin
Given I generate 20 MCQ questions
When I check the correct answer positions
Then the correct answer should appear in each position (A, B, C, D) roughly equally
```

## Success Metrics

- MCQ questions have exactly 4 options per question
- Distractors are plausible (not obviously wrong)
- Correct answer placement is roughly uniform across A–D

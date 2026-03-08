# User Story: Support Word Problem Question Format

**Story ID:** US-QG-009  
**Epic:** Full-Grade Question Generation & Management  
**Priority:** P1 (High)  
**Story Points:** 5  
**Sprint:** TBD

## User Story

```
As a student
I want questions presented as real-world word problems
So that I can develop applied mathematical reasoning skills
```

## Acceptance Criteria

### Functional Requirements

- [ ] **AC-001:** The generate endpoint accepts `format=word-problem`
- [ ] **AC-002:** AI generates a narrative context appropriate to the student's grade level
- [ ] **AC-003:** Word problems are culturally relevant (NZ context: NZD currency, local place names, familiar scenarios)
- [ ] **AC-004:** Response includes the numerical answer and a step-by-step breakdown
- [ ] **AC-005:** Word complexity and sentence length are appropriate for the grade
- [ ] **AC-006:** Works across all grades and topics

### Technical Requirements

- **REQ-QG-037:** Extend `questionFormat` to include `word-problem`
- **REQ-QG-038:** AI prompt includes grade-level vocabulary guidelines and NZ cultural context
- **REQ-QG-039:** Response includes `narrative` (the word problem text) and `stepByStepSolution` fields

## Definition of Done

- [ ] Word problem generation works for all grades and topics
- [ ] Narratives are age-appropriate and culturally relevant
- [ ] Step-by-step solutions explain the reasoning clearly
- [ ] Unit tests verify word problem structure
- [ ] Integration test confirms valid narrative responses

## Dependencies

- US-QG-004 (All math topics enabled)
- US-QG-011 / SCRUM-50 (LaTeX support — embedded math in word problems must use LaTeX notation)

## Technical Implementation Notes

- Extend AI prompt in `ollama.service.ts` with word problem instructions
- Leverage `curriculum-prompt-engine.ts` for NZ cultural context (already has NZ references)
- Include grade-level vocabulary constraints in the prompt (e.g. simpler words for Grade 3, more complex for Grade 8)

## Testing Scenarios

### Scenario 1: Grade 3 Word Problem

```gherkin
Given I request a word problem for Grade 3 ADDITION
When the AI generates the question
Then I should receive a narrative like "Aroha has 12 apples. Her friend gives her 8 more. How many apples does Aroha have now?"
And the answer should be 20
And the step-by-step solution should explain the addition
```

### Scenario 2: Grade 8 Word Problem

```gherkin
Given I request a word problem for Grade 8 FINANCIAL_LITERACY
When the AI generates the question
Then the narrative should involve realistic financial scenarios with NZD
And the vocabulary should be appropriate for a 13-year-old
```

## Success Metrics

- Word problems are contextually relevant and age-appropriate
- Step-by-step solutions included for all word problems
- NZ cultural context present in generated narratives

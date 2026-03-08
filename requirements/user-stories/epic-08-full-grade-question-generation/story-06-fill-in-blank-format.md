# User Story: Support Fill-in-the-Blank Question Format

**Story ID:** US-QG-008  
**Epic:** Full-Grade Question Generation & Management  
**Priority:** P1 (High)  
**Story Points:** 3  
**Sprint:** TBD

## User Story

```
As a student
I want fill-in-the-blank style questions (e.g. "12 + ___ = 20")
So that I can practice solving for unknowns
```

## Acceptance Criteria

### Functional Requirements

- [ ] **AC-001:** The generate endpoint accepts `format=fill-in-blank`
- [ ] **AC-002:** Questions contain a blank placeholder (`___`) in the expression
- [ ] **AC-003:** Response includes the correct value for the blank
- [ ] **AC-004:** Works across all grades and topics (e.g. `"___ × 4 = 28"`, `"3/4 + ___ = 1"`)
- [ ] **AC-005:** The blank can appear in any position (first operand, second operand, or result)

### Technical Requirements

- **REQ-QG-034:** Extend `questionFormat` to include `fill-in-blank`
- **REQ-QG-035:** AI prompt instructs the LLM to generate expressions with one missing value
- **REQ-QG-036:** Response includes `blankAnswer` field with the correct fill-in value

## Definition of Done

- [ ] Fill-in-blank generation works for all grades and topics
- [ ] Blank placeholder appears in varied positions
- [ ] Correct answer for the blank is included in the response
- [ ] Unit tests verify fill-in-blank structure
- [ ] Integration test confirms valid responses

## Dependencies

- US-QG-004 (All math topics enabled)
- US-QG-011 / SCRUM-50 (LaTeX support — blank expressions must use LaTeX, e.g. `$12 + \text{___} = 20$`)

## Technical Implementation Notes

- Extend AI prompt to request fill-in-blank format with `___` placeholder
- Add `blankAnswer` field to the response schema
- Reuse existing answer validation for the fill-in value

## Testing Scenarios

### Scenario 1: Fill-in-blank Addition

```gherkin
Given I request a fill-in-blank question for Grade 3 ADDITION
When the AI generates the question
Then I should receive something like "12 + ___ = 20"
And the blankAnswer should be "8"
```

### Scenario 2: Varied Blank Position

```gherkin
Given I generate 10 fill-in-blank questions
When I check the blank positions
Then the blank should appear in different positions across questions
```

## Success Metrics

- Fill-in-blank questions have exactly one blank per question
- Correct answer is mathematically accurate
- Blank position varies across generated questions

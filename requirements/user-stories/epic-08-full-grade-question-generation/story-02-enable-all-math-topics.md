# User Story: Enable All Math Topics per Grade

**Story ID:** US-QG-004  
**Epic:** Full-Grade Question Generation & Management  
**Priority:** P0 (Critical)  
**Story Points:** 8  
**Sprint:** TBD

## User Story

```
As a student
I want to practice any math topic available for my grade (e.g. fractions, algebra, geometry)
So that I can strengthen specific skills across the full curriculum
```

## Acceptance Criteria

### Functional Requirements

- [x] **AC-001:** The `GET /generate` endpoint accepts a `topic` parameter matching any topic in `GRADE_TOPICS` for the requested grade
- [x] **AC-002:** Requesting a topic not available for a grade returns a 400 error listing valid topics for that grade
- [x] **AC-003:** Subtraction, multiplication, division, and all other topics generate questions without errors
- [x] **AC-004:** AI prompts include topic-specific context (category, display name) from `curriculum.types.ts`
- [x] **AC-005:** The "not yet implemented" error for subtraction is removed
- [x] **AC-006:** All 50 grade×topic combinations defined in `GRADE_TOPICS` are supported

### Technical Requirements

- **REQ-QG-014:** Replace the two-value `OperationType` enum with a model that supports all topics in `GRADE_TOPICS`
- **REQ-QG-015:** Controller validates `topic` against `GRADE_TOPICS[grade]` for the requested grade
- **REQ-QG-016:** Remove operation-type switch/case pattern in the controller
- **REQ-QG-017:** `MathQuestion` entity's `operation` field accommodates all topic types
- **REQ-QG-018:** Curriculum prompt engine includes category context for each topic

## Definition of Done

- [x] All 50 grade×topic combinations generate questions via AI
- [x] Controller removes hardcoded operation-type switching
- [x] Invalid topic for a given grade returns clear error with valid options
- [x] Unit tests verify topic validation per grade
- [x] Integration tests confirm generation for at least one topic per grade
- [x] Entity model updated to accommodate all topic types

## Dependencies

- US-QG-003 (Grade support for Grades 3–8)
- US-QG-011 / SCRUM-50 (LaTeX support — all generated content must use LaTeX math notation)

## Technical Implementation Notes

- Replace `OperationType` enum with a type derived from `GRADE_TOPICS` values or a broader enum covering all 50 topics
- Remove the `switch (operationType)` pattern in the controller that throws "not yet implemented"
- Use the existing `GRADE_TOPICS` mapping in `curriculum.types.ts` as the source of truth for valid grade×topic pairs
- The AI prompt engine should pull topic `category` and `displayName` from `curriculum.types.ts` for richer prompts

## Testing Scenarios

### Scenario 1: Grade 4 Fraction Basics

```gherkin
Given I am a Grade 4 student
When I request questions for topic "FRACTION_BASICS"
Then I should receive questions about basic fractions
And the questions should be appropriate for Grade 4 level
```

### Scenario 2: Invalid Topic for Grade

```gherkin
Given I am a Grade 3 student
When I request questions for topic "ALGEBRAIC_EQUATIONS"
Then I should receive a 400 error
And the error should list valid topics for Grade 3: ADDITION, SUBTRACTION, MULTIPLICATION, DIVISION, PATTERN_RECOGNITION
```

### Scenario 3: Grade 8 Financial Literacy

```gherkin
Given I am a Grade 8 student
When I request questions for topic "FINANCIAL_LITERACY"
Then I should receive questions about financial concepts
And the questions should include NZ dollar (NZD) context
```

## Success Metrics

- All 50 grade×topic combinations generate valid questions
- No "not yet implemented" errors for any topic
- Topic validation rejects invalid combinations with helpful messages
- AI-generated questions are relevant to the requested topic

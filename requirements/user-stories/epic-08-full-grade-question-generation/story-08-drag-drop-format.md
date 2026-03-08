# User Story: Support Drag-and-Drop Question Format

**Story ID:** US-QG-010  
**Epic:** Full-Grade Question Generation & Management  
**Priority:** P2 (Medium)  
**Story Points:** 8  
**Sprint:** TBD

## User Story

```
As a student
I want drag-and-drop style questions (e.g. ordering numbers, matching pairs)
So that I can learn through interactive manipulation
```

## Acceptance Criteria

### Functional Requirements

- [ ] **AC-001:** The generate endpoint accepts `format=drag-drop`
- [ ] **AC-002:** Response includes a set of draggable items and their correct arrangement
- [ ] **AC-003:** Supports ordering tasks (e.g. "Sort these fractions from smallest to largest")
- [ ] **AC-004:** Supports matching tasks (e.g. "Match each expression to its answer")
- [ ] **AC-005:** Supports categorization tasks (e.g. "Sort these numbers into odd and even")
- [ ] **AC-006:** Works across relevant topics per grade

### Technical Requirements

- **REQ-QG-040:** Extend `questionFormat` to include `drag-drop`
- **REQ-QG-041:** Response schema includes `dragDropType` (`ordering | matching | categorization`), `items` array, and `correctArrangement`
- **REQ-QG-042:** AI prompt specifies the drag-drop sub-type and item count
- **REQ-QG-043:** Validate that `correctArrangement` is consistent with `items`

## Definition of Done

- [ ] Drag-and-drop generation works for ordering, matching, and categorization
- [ ] Response structure is well-defined and consistent
- [ ] Frontend can render the response without ambiguity
- [ ] Unit tests verify drag-drop response structure
- [ ] Integration test confirms valid drag-drop responses

## Dependencies

- US-QG-004 (All math topics enabled)
- US-QG-011 / SCRUM-50 (LaTeX support — draggable items containing math must use LaTeX)

## Technical Implementation Notes

- Define `DragDropData` interface with `type`, `items`, `correctArrangement`, and `categories` (for categorization)
- AI prompt must specify the sub-type and request structured JSON output
- Ordering: `items` is an array, `correctArrangement` is the sorted indices
- Matching: `items` is pairs `[{left, right}]`, `correctArrangement` maps left → right
- Categorization: `items` is values, `categories` is group names, `correctArrangement` maps item → category

## Testing Scenarios

### Scenario 1: Ordering Fractions

```gherkin
Given I request a drag-drop question for Grade 5 FRACTION_OPERATIONS
When the AI generates an ordering question
Then I should receive items like ["3/4", "1/2", "7/8", "1/4"]
And correctArrangement should be [3, 1, 0, 2] (1/4, 1/2, 3/4, 7/8)
```

### Scenario 2: Matching Expressions

```gherkin
Given I request a drag-drop question for Grade 4 MULTIPLICATION
When the AI generates a matching question
Then I should receive pairs like [{left: "3 × 4", right: "12"}, {left: "5 × 6", right: "30"}]
And correctArrangement should map each expression to its answer
```

### Scenario 3: Categorization

```gherkin
Given I request a drag-drop question for Grade 3 PATTERN_RECOGNITION
When the AI generates a categorization question
Then I should receive items and categories like "Odd" and "Even"
And correctArrangement should correctly assign each item to its category
```

## Success Metrics

- All three drag-drop sub-types generate valid responses
- Response structure is parseable by frontend without ambiguity
- Questions are pedagogically meaningful (not trivial)

## Notes

- This is the most complex format — consider implementing ordering first, then matching and categorization
- Frontend drag-and-drop rendering is out of scope for this story (backend only)

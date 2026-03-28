# User Story: Admin/Teacher Question Approval Workflow

**Story ID:** US-QG-006  
**Epic:** Full-Grade Question Generation & Management  
**Priority:** P0 (Critical)  
**Story Points:** 8  
**Sprint:** TBD

## User Story

```
As an admin or teacher
I want to review and approve AI-generated questions before they are available to students
So that only high-quality, accurate questions reach learners
```

## Acceptance Criteria

### Functional Requirements

- [ ] **AC-001:** Newly generated questions have status `pending` and are not visible to students
- [ ] **AC-002:** Admin/teacher can view a list of pending questions filtered by grade, topic, and format
- [ ] **AC-003:** Admin/teacher can approve a question, changing its status to `approved`
- [ ] **AC-004:** Admin/teacher can reject a question, changing its status to `rejected`, with an optional rejection reason
- [ ] **AC-005:** Admin/teacher can edit a question before approving it (e.g. fix wording, adjust answer)
- [ ] **AC-006:** Only `approved` questions are served to students during practice sessions
- [ ] **AC-007:** Bulk approve/reject is supported for efficiency (approve/reject multiple questions at once)
- [ ] **AC-008:** Approval actions are audit-logged with reviewer identity and timestamp

### Technical Requirements

- **REQ-QG-024:** Add `PATCH /questions/:id/approve` and `PATCH /questions/:id/reject` endpoints
- **REQ-QG-025:** Add `PATCH /questions/bulk-approve` and `PATCH /questions/bulk-reject` endpoints
- **REQ-QG-026:** Add `PUT /questions/:id` endpoint for editing question content before approval
- **REQ-QG-027:** Student-facing question retrieval endpoint filters by `status=approved` only
- **REQ-QG-028:** Store `reviewedBy`, `reviewedAt`, and `rejectionReason` fields on each question
- **REQ-QG-029:** Protect approval/rejection endpoints with admin/teacher role authorization

## Definition of Done

- [ ] Approve, reject, and edit endpoints implemented and working
- [ ] Bulk approve/reject operational
- [ ] Student practice endpoint only returns approved questions
- [ ] Audit fields (`reviewedBy`, `reviewedAt`) populated on approval/rejection
- [ ] Role-based authorization protects admin endpoints
- [ ] Unit tests cover approval state transitions
- [ ] Integration tests verify student cannot access pending/rejected questions

## Dependencies

- US-QG-005 (MongoDB persistence with status field)
- US-QG-005.5 (Admin/Teacher Login & Dashboard — provides JWT auth, role guards, and admin-app)

## Technical Implementation Notes

- Add approval endpoints to the `QuestionsController` created in US-QG-005
- Question status transitions: `pending` → `approved` or `pending` → `rejected`
- Rejected questions can be re-edited and resubmitted: `rejected` → `pending`
- Student-facing endpoint (used by student-app) must enforce `status=approved` filter at the service level — not just the query parameter
- Role-based guards: use NestJS guards to restrict approve/reject/edit to admin and teacher roles
- Bulk operations should use MongoDB `updateMany` for performance

## Testing Scenarios

### Scenario 1: Approve a Pending Question

```gherkin
Given there is a pending question "What is 12 × 3?"
When an admin approves the question
Then the question status should change to "approved"
And reviewedBy should be set to the admin's identity
And reviewedAt should be set to the current timestamp
```

### Scenario 2: Reject with Reason

```gherkin
Given there is a pending question with an incorrect answer
When a teacher rejects the question with reason "Answer is wrong, should be 36 not 34"
Then the question status should change to "rejected"
And the rejectionReason should be stored
```

### Scenario 3: Student Cannot See Pending Questions

```gherkin
Given there are 20 pending and 10 approved questions for Grade 5 ADDITION
When a student requests practice questions for Grade 5 ADDITION
Then only the 10 approved questions should be returned
And no pending or rejected questions should appear
```

### Scenario 4: Bulk Approval

```gherkin
Given there are 15 pending questions for Grade 3 MULTIPLICATION
When an admin selects all 15 and bulk approves them
Then all 15 questions should have status "approved"
And each should have reviewedBy and reviewedAt set
```

### Scenario 5: Edit and Re-approve

```gherkin
Given a question was rejected with reason "Typo in question text"
When a teacher edits the question text and resubmits
Then the question status should change back to "pending"
And the question is available for re-approval
```

## Success Metrics

- Zero unapproved questions visible to students
- Average review time < 30 seconds per question (bulk approve helps)
- Approval audit trail complete for all questions
- Rejection rate provides feedback signal on AI generation quality

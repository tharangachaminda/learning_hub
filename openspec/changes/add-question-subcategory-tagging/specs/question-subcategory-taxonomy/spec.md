## ADDED Requirements

### Requirement: Sub-category creation scoped to category and difficulty
The system SHALL allow an authenticated Admin or Teacher to create a sub-category defined by a `category` (must match an existing question category), a `difficulty` (`easy`, `medium`, or `hard`), and a `name`. The system SHALL derive a slug from `name` and SHALL reject creation with a conflict error when a sub-category with the same slug already exists for the same `category` + `difficulty` pair.

#### Scenario: Successful sub-category creation
- **WHEN** an Admin submits a new sub-category with `category: "number-operations"`, `difficulty: "medium"`, `name: "Skip Counting"`
- **THEN** the system creates the sub-category and returns it, available for future listing under that category+difficulty pair

#### Scenario: Duplicate sub-category rejected
- **WHEN** an Admin submits a new sub-category whose derived slug already exists for the same `category` + `difficulty` pair
- **THEN** the system rejects the request with a conflict error and does not create a duplicate entry

#### Scenario: Same name allowed under a different category or difficulty
- **WHEN** an Admin creates a sub-category named "Word Problems" under `category: "number-operations"`, `difficulty: "easy"`, and a sub-category also named "Word Problems" already exists under `category: "number-operations"`, `difficulty: "hard"`
- **THEN** the system allows the creation, since sub-category uniqueness is scoped to the (category, difficulty) pair, not the name alone

### Requirement: Sub-category listing for a category and difficulty pair
The system SHALL allow listing all sub-categories defined for a given `category` + `difficulty` pair, so Admin/Teacher users can see which sub-categories are available before tagging a question.

#### Scenario: List sub-categories for a category and difficulty
- **WHEN** an Admin requests sub-categories for `category: "geometry-measurement"`, `difficulty: "hard"`
- **THEN** the system returns every sub-category created for that exact category+difficulty pair, and none created for other pairs

#### Scenario: No sub-categories defined yet
- **WHEN** an Admin requests sub-categories for a category+difficulty pair that has none defined
- **THEN** the system returns an empty list rather than an error

### Requirement: Sub-category deletion blocked while in use
The system SHALL reject deletion of a sub-category that is currently referenced by at least one question's `subCategories`, requiring the sub-category to be untagged from all questions first.

#### Scenario: Delete blocked while referenced
- **WHEN** an Admin attempts to delete a sub-category that is still tagged on one or more questions
- **THEN** the system rejects the deletion with a conflict error and the sub-category remains available

#### Scenario: Delete succeeds once unreferenced
- **WHEN** an Admin attempts to delete a sub-category that no question currently references
- **THEN** the system deletes the sub-category and it no longer appears in future listings for its category+difficulty pair

### Requirement: Question tagging with sub-categories
The system SHALL allow an Admin or Teacher, while creating or editing a question, to view the sub-categories available for that question's category and difficulty, and to add or remove any number of them from the question's `subCategories`.

#### Scenario: Tag a question with a sub-category
- **WHEN** an Admin editing a question selects an existing sub-category matching the question's category and difficulty
- **THEN** the system adds that sub-category's slug to the question's `subCategories` and persists it on save

#### Scenario: Untag a question
- **WHEN** an Admin removes a previously-selected sub-category chip from a question being edited
- **THEN** the system removes that slug from the question's `subCategories` on save, without affecting the sub-category definition itself

#### Scenario: A question can carry multiple sub-categories
- **WHEN** an Admin selects three different sub-categories for the same question
- **THEN** the system persists all three slugs on the question's `subCategories`

### Requirement: Inline sub-category creation from question forms
The system SHALL allow an Admin or Teacher to create a brand-new sub-category directly from the question create/edit form, without navigating to a separate management screen, and immediately make the newly created sub-category selectable on the question being edited.

#### Scenario: Create and immediately apply a new sub-category
- **WHEN** an Admin, while editing a question, enters a new sub-category name not already in the list for that category+difficulty and confirms creation
- **THEN** the system creates the sub-category and adds it to the current question's `subCategories` selection in the same action

### Requirement: Sub-category management restricted to Admin and Teacher roles
The system SHALL restrict creating, listing, deleting, and assigning sub-categories to authenticated users with the `admin` or `teacher` role, consistent with existing question-management access control.

#### Scenario: Student cannot manage sub-categories
- **WHEN** a user with the `student` role attempts to create, delete, or list sub-categories
- **THEN** the system rejects the request as unauthorized

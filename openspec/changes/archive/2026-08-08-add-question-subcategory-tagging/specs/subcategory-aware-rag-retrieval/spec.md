## ADDED Requirements

### Requirement: Retrieval enumerates all sub-categories for the requested category and difficulty
When generating questions for a given grade, topic, and difficulty, the system SHALL resolve the topic's question category and SHALL fetch every sub-category defined for that category+difficulty pair before performing RAG retrieval.

#### Scenario: Sub-categories exist for the requested category and difficulty
- **WHEN** a generation request targets a topic whose category has three sub-categories defined for the requested difficulty
- **THEN** the system performs a separate, sub-category-scoped RAG retrieval for each of the three sub-categories

### Requirement: Retrieval falls back to a single pool when no sub-categories exist
When no sub-categories are defined for the requested category+difficulty pair, the system SHALL perform RAG retrieval and generation exactly as it did before sub-category support was added (a single unscoped pool), rather than failing or returning no results.

#### Scenario: Cold-start category with no sub-categories
- **WHEN** a generation request targets a category+difficulty pair that has zero sub-categories defined
- **THEN** the system retrieves and generates using the existing single-pool behavior, with no sub-category filter applied

### Requirement: Sub-category-scoped RAG retrieval filter
The system SHALL support filtering RAG retrieval results to only examples tagged with a specific sub-category, in addition to the existing grade, topic, and difficulty filters.

#### Scenario: Retrieval respects sub-category filter
- **WHEN** RAG retrieval is invoked with a sub-category filter set
- **THEN** the returned examples are all tagged with that sub-category, alongside matching the existing grade/topic/difficulty filters

#### Scenario: Thin sub-category pool degrades gracefully
- **WHEN** a sub-category has fewer indexed, tagged examples available than the configured sample size
- **THEN** the system uses all available examples for that sub-category rather than erroring or blocking generation

### Requirement: Sub-category description included in the generation prompt
When generating a question for an assigned sub-category, the system SHALL include that sub-category's `name` in the prompt sent to the LLM as explicit guidance, and SHALL also include its `description` when one is set, independent of whether any RAG examples were retrieved for that sub-category.

#### Scenario: Description included even with no RAG examples
- **WHEN** the system generates a question for a sub-category that currently has zero indexed, tagged examples
- **THEN** the assembled prompt still includes that sub-category's name and description as generation guidance

#### Scenario: Description included alongside RAG examples
- **WHEN** the system generates a question for a sub-category that has RAG examples available
- **THEN** the assembled prompt includes both the sub-category name/description guidance and the retrieved RAG examples

#### Scenario: Name-only guidance when description is not yet set
- **WHEN** the system generates a question for a sub-category that has no `description` (e.g. created before descriptions existed and not yet backfilled)
- **THEN** the assembled prompt includes the sub-category's name as guidance without an empty or malformed description clause

### Requirement: Generated question count distributed across sub-categories
When sub-categories exist for the requested category+difficulty, the system SHALL distribute the total requested question count evenly across all available sub-categories (round-robin, with any remainder assigned to the first sub-categories in the list), so the resulting batch spans the full known taxonomy rather than a single mixed pool.

#### Scenario: Even distribution across sub-categories
- **WHEN** a generation request asks for 9 questions and 3 sub-categories are available for the requested category+difficulty
- **THEN** the system generates 3 questions using each sub-category's retrieval pool

#### Scenario: Uneven distribution with a remainder
- **WHEN** a generation request asks for 5 questions and 3 sub-categories are available
- **THEN** the system generates 2 questions for the first sub-category, 2 for the second, and 1 for the third, all 5 accounted for

### Requirement: Generated questions tagged with their originating sub-category
When a question is generated using a sub-category-scoped retrieval pool, the system SHALL tag the resulting persisted question with that sub-category, so it can itself be retrieved as a future RAG example for the same sub-category.

#### Scenario: Generated question inherits its sub-category
- **WHEN** the system generates a question using the "Skip Counting" sub-category's retrieval pool
- **THEN** the persisted question's `subCategories` includes "Skip Counting"

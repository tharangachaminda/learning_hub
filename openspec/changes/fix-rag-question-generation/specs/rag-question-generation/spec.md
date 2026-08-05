## ADDED Requirements

### Requirement: Difficulty-filtered RAG retrieval
The system SHALL filter OpenSearch retrieval of question-bank examples by the requested difficulty tier (Easy/Medium/Hard), in addition to existing grade and topic filters, when assembling RAG context for question generation.

#### Scenario: Retrieval scoped to requested difficulty
- **WHEN** a question is generated for a given grade, topic, and difficulty (e.g. Year 0, Counting & Quantity, Easy)
- **THEN** the OpenSearch query used for RAG retrieval includes a hard filter on `metadata.difficulty` matching the requested difficulty, and only indexed examples of that difficulty are eligible to be returned

#### Scenario: No indexed examples at requested difficulty
- **WHEN** a question is generated for a grade/topic/difficulty combination with zero indexed examples at that exact difficulty
- **THEN** RAG retrieval returns an empty result set for that call (no cross-difficulty fallback), generation proceeds using the structural fallback instructions defined in the prompt style requirement below, and a warning is logged noting the thin/empty pool

### Requirement: Varied RAG example sampling
The system SHALL retrieve a pool of top-matching indexed examples larger than the number ultimately used in the prompt, and SHALL randomly sample the subset included in each generation call, so that repeated generations for the same grade/topic/difficulty do not always use the same fixed examples.

#### Scenario: Batch generation draws from varied examples
- **WHEN** multiple questions are generated in sequence (e.g. a batch of 10) for the same grade, topic, and difficulty, and more than 5 matching examples are indexed
- **THEN** the set of RAG examples included in the prompt is not identical across all calls in the batch

#### Scenario: Pool smaller than sample size
- **WHEN** the filtered retrieval pool (matching grade/topic/difficulty) contains fewer examples than the configured per-call sample size
- **THEN** all available examples in the pool are used for that call, without error

### Requirement: RAG examples drive generated question style
The system SHALL construct the LLM prompt so that retrieved RAG examples are presented as the primary style/pattern reference for generation, and SHALL NOT impose a hard-coded literal phrasing template that overrides the style suggested by retrieved examples when examples are present.

#### Scenario: Generated question reflects indexed style
- **WHEN** RAG retrieval returns one or more indexed examples for the requested grade/topic/difficulty
- **THEN** the assembled prompt presents those examples as a style/pattern reference for the LLM to follow, using different numbers/objects/context than the examples (not verbatim duplicates), and the prompt does not contain a fixed literal question-phrasing template that would override that style
- **AND** structural constraints (valid JSON response, referencing only approved visual-catalog objects, difficulty-appropriate count ranges) remain enforced regardless of RAG content

#### Scenario: No RAG examples available (cold start)
- **WHEN** RAG retrieval returns zero examples for the requested grade/topic/difficulty (e.g. topic not yet indexed)
- **THEN** the prompt falls back to generic structural/clarity guidance (not the removed rigid literal template) so generation still produces a valid, age-appropriate question

### Requirement: RAG retrieval and prompt observability
The system SHALL provide logging that allows verification of which RAG examples were retrieved and used, and what was actually sent to the LLM, gated behind a debug/verbose log level so it is not always-on in production.

#### Scenario: Debug logging enabled
- **WHEN** debug/verbose logging is enabled for the question-generation service
- **THEN** logs include the specific RAG examples retrieved (id and question text, not just a count) and the fully assembled prompt sent to the LLM for each generation call

#### Scenario: Debug logging disabled (default/production)
- **WHEN** debug/verbose logging is not enabled
- **THEN** only the existing summary-level log (counts of RAG examples/near-duplicates found) is emitted, and full prompt/example content is not logged

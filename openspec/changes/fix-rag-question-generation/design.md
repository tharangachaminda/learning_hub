## Context

Question generation combines a local Ollama LLM (`llama3.1:latest`) with RAG retrieval from an OpenSearch index (`math-questions`) of previously indexed, curated questions. For Year 0 Counting & Quantity, three difficulty tiers (Easy/Medium/Hard) have been indexed. Generated output does not resemble the indexed style. Root-cause investigation of the current pipeline (`api/src/app/ai/ollama.service.ts`, `api/src/app/ai/curriculum-prompt-engine.ts`, `api/src/app/opensearch/semantic-search.service.ts`) found three compounding causes:

1. The system prompt (`curriculum-prompt-engine.ts`) and, for topics using the visual catalog (`buildVisualCatalogPromptSection`, `ollama.service.ts`), hard-code exact generic phrasing (e.g. "How many [objects] are shown altogether?") and forbid alternative framings ("Do NOT invent story scenes..."). These blocks are large, repeated, and appear before the RAG section in the prompt.
2. `buildRAGPromptSection` appends retrieved examples as a short "reference only — write something COMPLETELY DIFFERENT" block, which is both structurally weak (5 lines vs. hundreds) and explicitly instructs divergence from the examples' style.
3. `SemanticSearchService.SearchFilters` only supports `grade`/`topic`/`operation`/`excludeIds`/`limit` — no `difficulty` — so retrieval mixes all three indexed difficulty tiers. Additionally, `retrieveRAGContext` builds a fixed search-query string per (topic, grade, difficulty) and `EmbeddingService` caches embeddings by exact text, so the same top-5 nearest neighbors are returned on every call, regardless of how many questions are indexed.

## Goals / Non-Goals

**Goals:**
- Retrieved RAG examples visibly and reliably shape the style/pattern of generated questions.
- Retrieval respects the requested difficulty tier as a hard filter, alongside existing grade/topic filters.
- Repeated generations (within a batch and across sessions) draw from a broader sample of indexed examples rather than a fixed set of 5.
- The prompt actually sent to Ollama, and the specific RAG examples used, are logged/inspectable for debugging.
- Fix is general to the RAG/prompt pipeline, not special-cased to Counting & Quantity, so it benefits all topics/grades as more get indexed.

**Non-Goals:**
- Changing the embedding model, index engine (`lucene`/HNSW), or similarity metric (cosine).
- Building an admin UI for inspecting RAG retrieval (logging only in this change).
- Changing MongoDB persistence schema for generated/saved questions.
- Reworking the visual-catalog asset system itself (object/shape catalog stays; only the rigid phrasing rules it imposes are relaxed).

## Decisions

### 1. Relax hard-coded phrasing rules, keep structural constraints
`buildQuestionFormatRules` (curriculum-prompt-engine.ts) and `buildVisualCatalogPromptSection` (ollama.service.ts) currently dictate literal wording. Change these to state *structural* constraints only:
- Must reference only objects present in the approved visual catalog (safety: prevents hallucinated visuals).
- Must respect per-difficulty count ranges (Easy 2-5, Medium 5-8, Hard 8-12 — existing behavior, kept).
- Must produce valid strict-JSON per the existing response contract (unchanged).

Remove the literal phrasing template and "do NOT invent story scenes" prohibition; replace with an instruction to **derive phrasing/style from the REFERENCE EXAMPLES section** when present, falling back to the structural constraints only when no RAG examples are available (cold-start / not-yet-indexed topics).

*Alternative considered*: Keep the rigid template and only "blend in" RAG phrasing. Rejected per explicit product decision — the hard-coded template is itself judged to be the generic pattern the user wants eliminated, not merely a competing signal.

### 2. Strengthen the RAG prompt section
Rewrite `buildRAGPromptSection` to present examples as the primary style driver, ahead of the (now-reduced) structural rules where practical, e.g.:
```
STYLE REFERENCE (match tone, structure, and phrasing style of these indexed questions,
but use different numbers/objects/context so it is not a duplicate):
1. "<question>" (answer: <answer>)
...
```
Keep the explicit "different numbers/objects, not a duplicate" instruction (avoids verbatim copies) but drop "COMPLETELY DIFFERENT," which currently reads as license to ignore style entirely.

### 3. Add `difficulty` as a hard filter
Add `difficulty?: string` to `SemanticSearchService.SearchFilters`. Extend `buildFilterClauses` with an exact term filter on `metadata.difficulty` (mirrors the existing `grade` filter — already a `keyword` field in the index mapping, so no reindex/mapping change needed). Update `retrieveRAGContext` (ollama.service.ts) to pass `difficulty` through to `findSimilar`.

*Alternative considered*: Widen difficulty to a range (e.g. include adjacent tiers) for more pool depth. Rejected for this change — indexed volume per tier is unknown/likely small; start with exact-match filtering and revisit if pool sizes prove too small in practice (see Open Questions).

### 4. Pool + sample for retrieval variety
Change `retrieveRAGContext` to request a larger pool from OpenSearch (`limit` raised from 5 to a configurable `ragPoolSize`, default 20) filtered by grade/topic/difficulty, then randomly sample `ragExampleLimit` (still 5) examples from that pool per generation call. This replaces the current fully-deterministic top-5 behavior. Sampling uses `Math.random()`-based selection (no seeding needed — variety is the goal, not reproducibility).

Two things must change for this to actually vary results, not just add unused code:
- The search query text passed to the embedding call must stop being cached in a way that defeats variety — since the *query* stays fixed per (topic, grade, difficulty), the pool itself will still be deterministic (same top-20), but the **sampled subset** of 5 from that pool of 20 will vary per call. This is sufficient: it turns "same 5 forever" into "5 of up to 20, varying," proportional to how many have been indexed.
- If fewer than `ragExampleLimit` results exist in the pool (e.g. only 3 indexed for a tier), use all available rather than erroring.

*Alternative considered*: Vary the embedding query itself (e.g. inject randomness/jitter into the search text) to get genuinely different nearest-neighbor pools per call. Rejected as first pass — adds nondeterminism to retrieval quality/relevance for uncertain benefit; pool+sample achieves the stated goal (draw from more of the indexed set) with lower risk. Can revisit if indexed volume grows much larger than pool size.

### 5. Add prompt/retrieval debug logging
Log the fully assembled `prompt` string (or at minimum the RAG section + structural rules actually included) and the sampled RAG examples (id + question text) at `debug`/`verbose` level before the POST to `/api/generate`, and log the full retrieved pool (not just count) in `retrieveRAGContext`. Keep existing count-only log for normal operation; add a config flag or log-level gate so full-prompt logging isn't always-on in production (prompts can be large and may include curriculum content).

## Risks / Trade-offs

- [Relaxing hard-coded phrasing rules could regress output quality/consistency for topics or difficulty levels with few or no indexed examples yet] → Structural constraints (valid JSON, catalog-object-only, count ranges) remain enforced; fallback behavior when RAG pool is empty keeps a baseline instruction (not the old literal template, but a generic "clear, age-appropriate phrasing" fallback) so cold-start topics don't degrade further.
- [Difficulty exact-match filtering may return very few or zero results if a tier is thinly indexed] → `retrieveRAGContext` must handle 0-3 results gracefully (already partially handled — empty RAG section is a no-op today); log a distinct warning when pool size is below `ragExampleLimit` so thin indexing is visible to whoever maintains the question bank, rather than silently degrading.
- [Larger pool retrieval (20 vs 5) increases OpenSearch query cost] → Negligible at current/expected index sizes (low hundreds of docs per topic); k=20 kNN queries are still fast on HNSW. Revisit if index grows to tens of thousands of docs per topic/difficulty.
- [Full-prompt debug logging could leak curriculum content or clutter logs in production] → Gate behind explicit debug/verbose log level, off by default in production config.
- [Removing "COMPLETELY DIFFERENT" instruction could increase near-duplicate generation] → Existing duplicate-detection safeguard (`ragDuplicateThreshold = 0.95`, near-duplicate exclusion list) is unrelated to this instruction and stays in place unchanged; explicit "use different numbers/objects/context" instruction is retained in the rewritten RAG section (Decision 2).

## Migration Plan

- No data migration required — `metadata.difficulty` already exists on indexed documents (confirmed in index mapping/investigation); filter changes are query-side only.
- Rollout is a straightforward code deploy (API service only); no schema changes to OpenSearch mapping, MongoDB, or the public API contract.
- Rollback: revert the API deploy; no data changes to unwind.
- Recommended validation before/after: generate a batch of Year 0 Counting & Quantity questions per difficulty tier, inspect logged prompts/RAG examples, and manually compare output style against indexed examples.

## Open Questions

- What is the actual current indexed volume per (topic, difficulty) tier? Determines whether `ragPoolSize = 20` is meaningful or usually just "all of them." (Doesn't block implementation — degrades gracefully either way.)
- Should `ragPoolSize` and `ragExampleLimit` be environment-configurable (like `OLLAMA_MODEL`) rather than constants, given index volume will grow over time? Leaning yes, low cost — to confirm during implementation.

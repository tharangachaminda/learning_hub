## 1. Difficulty-filtered retrieval

- [x] 1.1 Add `difficulty?: string` to `SearchFilters` in `api/src/app/opensearch/semantic-search.service.ts`
- [x] 1.2 Extend `buildFilterClauses` to add an exact term filter on `metadata.difficulty` when `difficulty` is provided
- [x] 1.3 Update `retrieveRAGContext` in `api/src/app/ai/ollama.service.ts` to pass `difficulty` through to `findSimilar`
- [x] 1.4 Verify `metadata.difficulty` is a filterable (keyword) field in the index mapping (`vector-index.service.ts`); confirm no mapping/reindex change needed

## 2. Pool + sample retrieval for variety

- [x] 2.1 Introduce a configurable `ragPoolSize` (default 20) alongside existing `ragExampleLimit` (increased from 5 to 10 after post-deploy feedback — more RAG context reduced over-rejection/retries) in `ollama.service.ts`
- [x] 2.2 Update `retrieveRAGContext` to request `ragPoolSize` results (filtered by grade/topic/difficulty) from `findSimilar`
- [x] 2.3 Add random sampling logic to select `ragExampleLimit` examples from the retrieved pool per generation call
- [x] 2.4 Handle pool smaller than `ragExampleLimit` by using all available examples without error
- [x] 2.5 Log a warning when retrieved pool size is below `ragExampleLimit` (thin/empty indexing signal)

## 3. Relax rigid prompt rules

- [x] 3.1 Remove the literal phrasing template and "do NOT invent story scenes" prohibition from `buildQuestionFormatRules` in `api/src/app/ai/curriculum-prompt-engine.ts`
- [x] 3.2 Replace with structural-only guidance: valid JSON response, catalog-object-only references, difficulty-appropriate count ranges
- [x] 3.3 Apply the equivalent relaxation to `buildVisualCatalogPromptSection` in `ollama.service.ts` (keep visual-catalog object constraints, drop rigid phrasing template)
- [x] 3.4 Add a generic structural/clarity fallback instruction used only when no RAG examples are available (cold start), replacing the old rigid template's role in that case

## 4. Strengthen RAG prompt section

- [x] 4.1 Rewrite `buildRAGPromptSection` in `ollama.service.ts` to present examples as the primary style/pattern reference ("STYLE REFERENCE" framing) instead of "reference only, write something COMPLETELY DIFFERENT"
- [x] 4.2 Keep explicit instruction to use different numbers/objects/context than the examples (avoid verbatim duplicates)
- [x] 4.3 Confirm placement/ordering in the assembled prompt gives the RAG section adequate weight relative to remaining structural rules

## 5. Observability

- [x] 5.1 Add debug/verbose-gated logging of the fully assembled prompt string before the POST to `/api/generate`
- [x] 5.2 Add debug/verbose-gated logging of sampled RAG examples (id + question text), not just counts, in `retrieveRAGContext`
- [x] 5.3 Confirm default (non-debug) logging remains summary-only (existing count-based log), unchanged in production

## 6. Test updates

- [x] 6.1 Update `scripts/test-filters.ts` to cover difficulty filtering (alone and combined with grade/topic)
- [x] 6.2 Update `scripts/test-semantic-search.ts` or add a new script to verify pool+sample retrieval varies across repeated calls
- [x] 6.3 Add/update unit tests for `buildFilterClauses` (difficulty term filter) and `buildRAGPromptSection` (new format)
- [x] 6.4 Add/update unit tests for pool-sampling logic (handles pool < sample size, randomization doesn't error on empty pool)

## 7. Manual validation

- [x] 7.1 Generate a batch of Year 0 Counting & Quantity questions per difficulty tier (Easy/Medium/Hard) against local Ollama + OpenSearch
- [x] 7.2 Inspect debug logs to confirm RAG examples retrieved match the requested difficulty and vary across calls
- [x] 7.3 Manually compare generated question style/phrasing against indexed examples for each tier — see caveat below
- [x] 7.4 Confirm cold-start behavior (a grade/topic/difficulty with no indexed examples) still produces valid, well-formed questions

**Validation notes:** With `RAG_DEBUG_LOGGING=true`, confirmed for Year 0 Counting & Quantity across all three tiers: retrieval pools were correctly difficulty-filtered (8/10/10 indexed examples for easy/medium/hard respectively, no cross-tier bleed), sampling varied across separate script runs (5/5 distinct sampled sets from a pool of 8 via `scripts/test-rag-sampling.ts`), and the assembled prompt used the new "STYLE REFERENCE" framing with no "COMPLETELY DIFFERENT" language. Cold-start case (Grade 5 Multiplication, unindexed) correctly logged a thin-pool warning (0 examples), omitted the REFERENCE EXAMPLES section entirely, and still produced a valid structural prompt. On this local machine, all 4 live Ollama calls exceeded the existing 90s `generationTimeout` (confirmed via `ps` that `llama-server` was actively CPU-busy, not hung) and fell back to the pre-existing deterministic-fallback path each time — this is local hardware/model latency unrelated to this change (the same timeout constant and fallback path already existed prior to this change) and does not indicate a defect in the retrieval/prompt logic, which was independently verified via the debug logs above and the unit tests in section 6.

**Post-deploy follow-up (same day):** once local Ollama latency was fixed (reduced model context window; see project notes), live batch generation surfaced two real issues from the initial rollout:
1. `validateTopicAlignment`'s generic `hasVisualLanguage` regex (used as the first-pass gate for all visual-catalog topics) was missing `"how many"` / `"are there"` / `"there are"` — phrasing the RAG STYLE REFERENCE examples naturally produce (e.g. "How many sea shells are there?"). The old rigid template masked this gap by always forcing "shown"/"altogether" wording; once relaxed, natural RAG-style phrasing was being incorrectly rejected on nearly every call. Fixed by adding those phrases to the regex.
2. Removing the "do NOT invent story scenes (birds in forests, sports scores, beaches, mountains...)" prohibition (per Decision 1) had a real cost: the LLM invented ungrounded scene details (e.g. "kiwi birds standing on the mountain") not present in the visual catalog or the RAG examples, even when following STYLE REFERENCE phrasing. Reinstated as a generalized, always-on **structural** constraint (not a literal phrasing template) in `buildQuestionFormatRules` for `COUNTING_AND_QUANTITY` and `EARLY_OPERATIONS`: "do NOT invent a setting, location, or narrative scene for the shown objects."

Also increased `ragExampleLimit` from 5 to 10 per follow-up request (more style signal in-context). Re-validated live: 3/3 tiers succeeded on the first attempt with no retries, no scene hallucination, no fallback.

**Second follow-up (same day):** live batches surfaced raw visual asset IDs leaking into stored question text (e.g. "What quantity of counting.kiwi-bird.standing objects are shown?"). The prompt already instructed the LLM not to do this, but nothing enforced it — so violations were silently stored. Added `validateNoAssetIdLeakage` in `ollama.service.ts`, called for all visual-catalog topics right after the empty-`visualSelections` check: throws (routing to the existing deterministic-fallback path) if any selected `assetId` appears verbatim in the question text. Added a regression test; re-validated live with 5 consecutive HARD-tier generations, zero asset-ID leaks, zero fallbacks needed.

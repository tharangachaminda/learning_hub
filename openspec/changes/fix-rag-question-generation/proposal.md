## Why

LLM-generated questions do not resemble the style of the questions indexed in OpenSearch for RAG. Investigation traced this to three compounding issues in the generation pipeline: (1) rigid, hard-coded prompt instructions for topics like Counting & Quantity override whatever style the retrieved examples suggest, (2) OpenSearch retrieval has no difficulty filter, so Easy/Medium/Hard requests can all draw from the same mixed pool, and (3) retrieval is fully deterministic (fixed query text + embedding cache), so the same 5 examples are retrieved every time for a given topic/grade/difficulty, regardless of how many questions have actually been indexed. The system needs to actually use indexed examples to drive variety and style, as originally intended.

## What Changes

- Relax the hard-coded generic phrasing/format rules in the curriculum and visual-catalog prompt sections (`curriculum-prompt-engine.ts`, `buildVisualCatalogPromptSection` in `ollama.service.ts`) so RAG example style/wording can actually influence output, keeping only true structural/safety constraints (valid JSON, referencing only approved visual catalog objects, count-range bounds per difficulty).
- Rewrite `buildRAGPromptSection` so retrieved examples are presented as a stronger style/pattern signal rather than a weak "reference only, write something completely different" afterthought.
- Add `difficulty` as a hard filter in `SemanticSearchService` (`SearchFilters`, `buildFilterClauses`, `buildKnnQuery`) so retrieval only returns indexed examples matching the requested difficulty tier, alongside existing grade/topic filters.
- Change RAG retrieval to pull a larger top-k pool (e.g. 15-20) matching grade/topic/difficulty, then randomly sample a smaller subset (e.g. 5) per generation call, so repeated generations and batches draw from more of the indexed set instead of the same fixed examples every time.
- Add logging of the fully assembled prompt and the specific RAG examples retrieved (question text + id), so RAG participation in generation can be verified/debugged going forward.
- **BREAKING**: `SemanticSearchService.SearchFilters` interface gains a `difficulty` field; any existing callers of `findSimilar`/`buildFilterClauses` that construct filters directly will need review (internal API only, no external consumers found).

## Capabilities

### New Capabilities
- `rag-question-generation`: End-to-end behavior for how indexed question-bank examples are retrieved from OpenSearch (filtered by grade/topic/difficulty, sampled from a pool for variety) and incorporated into the LLM prompt to steer style/pattern of newly generated questions, plus the observability needed to verify this is working.

### Modified Capabilities
(none — no existing specs in `openspec/specs/`)

## Impact

- **Affected code**: `api/src/app/ai/ollama.service.ts` (prompt assembly, RAG retrieval invocation, `buildRAGPromptSection`), `api/src/app/ai/curriculum-prompt-engine.ts` (system prompt / difficulty & topic enforcement rules), `api/src/app/opensearch/semantic-search.service.ts` (`SearchFilters`, `buildFilterClauses`, `buildKnnQuery`), `api/src/app/opensearch/vector-index.service.ts` (index mapping, if `difficulty` needs to move from `metadata` sub-field to a directly filterable field — to confirm in design).
- **Affected systems**: OpenSearch (`math-questions` index, running in Docker), Ollama (local LLM + embedding model `nomic-embed-text`), no MongoDB schema changes expected.
- **Testing impact**: Existing RAG/semantic-search test scripts (`scripts/test-semantic-search.ts`, `scripts/test-filters.ts`) do not exercise difficulty filtering and will need updates to cover it.
- **No breaking changes to public API contracts** — `POST /api/questions/batch-generate` request/response shape is unchanged; changes are internal to generation quality.

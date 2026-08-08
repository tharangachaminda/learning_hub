## Context

Question categories (`QUESTION_CATEGORIES` in `api/src/app/ai/curriculum.types.ts`) and difficulty levels (`easy`/`medium`/`hard`, `PersistedQuestionDifficulty`) are hard-coded TS constants — there is no DB-backed taxonomy today, and no CRUD module exists to mirror for a new taxonomy type. `Question` (`api/src/app/questions/schemas/question.schema.ts`) has a `category: string` field but nothing finer-grained. RAG retrieval (`SemanticSearchService.findSimilar`, `SearchFilters`) filters on `grade`/`topic`/`operation`/`difficulty` (the last added in `fix-rag-question-generation`) but not category or anything sub-category-like, so all indexed questions for a given (grade, topic, difficulty) are pooled together regardless of how varied their style/pattern actually is. Generation (`ollama.service.ts` `retrieveRAGContext`, `math-question-generator.service.ts`) makes one retrieval call per generation request.

Admin/Teacher-facing question forms (`apps/admin-app/src/app/features/create-question/create-question.ts`, `generate-questions.ts`) expose grade/topic/difficulty pickers but no tagging UI of any kind — this is new UI, not an extension of an existing pattern. Existing role-gated CRUD (`questions.controller.ts`) uses `JwtAuthGuard` + `RolesGuard` + `@Roles('admin', 'teacher')`, which the new sub-category module will reuse directly.

## Goals / Non-Goals

**Goals:**
- Let Admin/Teacher define sub-categories scoped to a (category, difficulty) pair, and tag/untag questions with any number of them.
- Let RAG retrieval and generation iterate across every sub-category defined for the requested category+difficulty, instead of one mixed pool, to broaden coverage.
- Degrade gracefully to today's behavior when no sub-categories exist yet for a given category+difficulty (cold start / not yet adopted for that pairing).
- Keep the change additive to existing schema/index/API — no removal of current grade/topic/difficulty filtering.

**Non-Goals:**
- Auto-suggesting or LLM-generating sub-category names — creation is a manual admin/teacher action (a text name input), not inferred.
- Retroactively back-filling sub-category tags onto existing questions/indexed documents — pre-existing questions simply have an empty `subCategories` list until manually re-tagged.
- Hierarchical (nested) sub-categories — flat list scoped to (category, difficulty) only.
- Auto-generating or validating the *quality* of sub-category descriptions — creation and update require a non-empty `description`, but the content is entirely the admin/teacher's responsibility; no linting, length minimums beyond non-empty, or LLM-assisted suggestions.
- Changing the embedding model, vector index engine, or similarity metric.
- A standalone "taxonomy management" admin screen — sub-category CRUD happens inline from the question create/edit and generate forms only (per proposal: "should be able to see the sub categories when they create/edit questions").

## Decisions

### 1. Data model: new `SubCategory` collection, scoped by (category, difficulty)
New Mongo collection `subcategories` with schema:
```
{ _id, category: string, difficulty: 'easy'|'medium'|'hard', name: string, slug: string,
  description?: string, createdBy: ObjectId, createdAt, updatedAt }
```
Compound unique index on `{ category, difficulty, slug }` — the same sub-category name can exist independently under different category/difficulty pairs (e.g. "Word Problems" under both easy and medium), but not duplicated within one pairing. `category` is validated against the existing `QUESTION_CATEGORIES` keys at the DTO layer (no new enum source of truth introduced).

`description` is a short free-text explanation of what the sub-category covers (e.g. "Counting up or down in equal steps, e.g. 2s, 5s, 10s" for "Skip Counting"). It is **required at creation** (Decision 3) so the taxonomy can meaningfully guide LLM generation (Decision 9), but kept **optional at the schema level** so pre-existing `SubCategory` documents created before this field existed remain valid without a migration (Migration Plan).

*Alternative considered*: Store sub-categories as a free-text array directly on `Question` with no separate collection (pure tags, no taxonomy). Rejected — the proposal requires sub-categories to be *discoverable and selectable* per category+difficulty in the UI ("Admin/Teacher should be able to see the sub categories") and requires retrieval to *enumerate all sub-categories for a category+difficulty*, both of which need a queryable list independent of which questions happen to reference them.

### 2. `Question.subCategories: string[]` stores slugs, not ObjectIds
Mirrors how `category` is already stored as a plain string slug on `Question` (not a foreign key), keeping read paths (including OpenSearch indexing, which serializes `Question` fields into `metadata`) simple — no join/populate needed to know a question's tags. Add index `{ category: 1, 'metadata.difficulty': 1, subCategories: 1 }` to support the admin list/filter view and any future Mongo-side sub-category queries.

### 3. Sub-category CRUD API mirrors `questions` module conventions
New `SubCategoriesController`/`SubCategoriesService`/`subcategory.schema.ts` under `api/src/app/subcategories/`, guarded with `JwtAuthGuard` + `RolesGuard` + `@Roles('admin', 'teacher')` (same as `questions.controller.ts`):
- `GET /api/subcategories?category=&difficulty=` — list for a category+difficulty pair (powers both the tag picker and the RAG retrieval loop).
- `POST /api/subcategories` — create `{ category, difficulty, name, description }`; slug derived server-side (kebab-case of `name`); `description` required and non-empty (400 if missing/empty — see Decision 9 for why); 409 on duplicate within the same (category, difficulty).
- `PATCH /api/subcategories/:id` — update `{ description }` on an existing sub-category; 400 if `description` is missing/empty. Scoped to `description` only — `category`, `difficulty`, `name`, and therefore `slug` are immutable after creation, since they define the sub-category's identity and are what retrieval/tagging key off; only the free-text guidance text is expected to need revision (e.g. backfilling a description onto a sub-category created before this field existed).
- `DELETE /api/subcategories/:id` — remove a sub-category definition.

**Delete semantics**: block deletion (409) if any `Question` currently references the sub-category's slug for that category+difficulty; the admin must untag affected questions first. *Alternative considered*: cascade-delete the tag from all referencing questions automatically. Rejected — silently mutating question data as a side effect of an unrelated taxonomy-management action is surprising and hard to audit; an explicit block keeps the two actions (untag questions, delete taxonomy entry) separate and visible.

Tagging a question (add/remove a sub-category on `Question.subCategories`) happens through the existing `PATCH` question-update endpoint (`UpdateQuestionDto` gains an optional `subCategories: string[]`), not a separate endpoint — it's just a field update, consistent with how `category`/`difficulty` are already edited.

### 4. Index mapping: additive `metadata.subCategory` keyword field, no forced reindex
Add `subCategory: { type: 'keyword' }` (singular per question-tag instance — see Decision 5) to `getIndexMapping()` in `vector-index.service.ts`. OpenSearch allows adding a new field to an existing mapping without reindexing prior documents; those documents simply have no value for it and are excluded from `subCategory`-filtered queries until re-indexed after being tagged. This matches the Non-Goal of not back-filling existing data.

### 5. RAG filter and indexing: one indexed doc per (question, sub-category) tag, not an array match
`SearchFilters` gains `subCategory?: string` (exact-term filter on `metadata.subCategory`, same pattern as the existing `difficulty` filter from `fix-rag-question-generation`). Since a question can carry multiple sub-category tags, and retrieval needs precise "give me examples for *this* sub-category" pools (not "any question that happens to include this tag among others"), `QuestionIndexingService` indexes **one OpenSearch document per (question, tag) pair** when `subCategories` is non-empty (fan-out at index time, keyed `${questionId}#${slug}` to keep doc IDs distinct), falling back to a single document with no `subCategory` value when the array is empty. This keeps `buildFilterClauses`/`buildKnnQuery` as simple single-value term filters, consistent with the existing `grade`/`topic`/`difficulty` filters, rather than requiring an array-contains query.

*Alternative considered*: Index `subCategories` as a `keyword` array field and filter with a `terms`/`match` query for "contains this tag." Rejected — simpler to implement, but a question tagged with 3 sub-categories would surface in all 3 retrieval pools with full weight regardless of relevance to each, muddying the "examples for this specific sub-category" signal the generation loop (Decision 6) depends on. Fan-out is more indexing complexity but keeps retrieval semantics exact.

### 6. Generation loop: enumerate sub-categories, retrieve + generate per sub-category, fall back when none exist
`math-question-generator.service.ts` (or a thin wrapper it calls) resolves the target `category` for the requested `topic` (existing `QUESTION_TYPE_TO_CATEGORY` mapping), then:
1. Calls `SubCategoriesService.list(category, difficulty)`.
2. If **empty**: unchanged current behavior — one `retrieveRAGContext(grade, topic, difficulty)` call, no `subCategory` filter (cold start / not yet adopted).
3. If **non-empty** (N sub-categories): distribute the requested `count` across all N round-robin (`count / N` each, remainder to the first `count % N`), and for each sub-category call `retrieveRAGContext(grade, topic, difficulty, subCategory)` → pool + sample (existing pool/sample logic from `fix-rag-question-generation`, unchanged) → generate that sub-category's share of questions, tagging generated `Question` records with that sub-category slug on save.

*Alternative considered*: Let the caller (batch-generate request) explicitly pick one sub-category per call instead of the system auto-distributing across all of them. Rejected per proposal wording ("the system should pickup questions from each subsection... Then LLM can generate questions for each sub category") — the intent is automatic breadth, not caller-driven selection. The public `POST /api/questions/batch-generate` request shape is therefore unchanged (still `{ grade, topic, count, difficulty }`); only the response's questions now carry a populated `subCategories` field when applicable. This is additive, not breaking, at the public API layer — the **BREAKING** note in the proposal applies only to the internal `SearchFilters` interface and `retrieveRAGContext` call signature.

### 7. Admin/Teacher UI: tag picker on question forms, inline creation
`create-question.ts` and `generate-questions.ts` gain a sub-category multi-select (chip list) that: (a) loads options via `GET /api/subcategories?category=&difficulty=` whenever the derived category or selected difficulty changes, (b) lets the user toggle existing chips on/off (add/remove tags on the question being edited), and (c) offers a "+ create new" inline input — now capturing both `name` and `description` — that calls `POST /api/subcategories` and immediately adds the new chip to the current selection. No new admin route/page — this satisfies "see the sub categories when they create/edit questions" directly in the existing forms.

The same shared picker component also surfaces an inline "add description" affordance on any chip whose sub-category has no `description` yet, calling the new `PATCH /api/subcategories/:id` endpoint (Decision 3). This appears wherever the interactive (non-read-only) picker is used, but is most impactful on the question edit screen, where an admin reviewing an existing question can backfill a description onto a sub-category that predates this field — including one already tagged on that question — without needing to delete and recreate it (delete is blocked while in use, per Decision 3).

### 9. Sub-category description is injected directly into the generation prompt, not just used for retrieval filtering
`MathQuestionGenerator` already resolves the full list of `SubCategory` documents (via `SubCategoriesService.list`) to build the round-robin assignment (Decision 6). Instead of passing just the assigned `slug` through to `OllamaService.generateMathQuestion`, it now passes the resolved `{ slug, name, description }`. `generateMathQuestion` builds a new prompt section from this — e.g.:
```
SUB-CATEGORY FOCUS: This question must be about "<name>" — <description>.
```
placed as an explicit instruction ahead of the existing RAG "STYLE REFERENCE" section (from `fix-rag-question-generation`), and included **even when no RAG examples exist yet for that sub-category** (unlike the RAG section, which is a no-op when the pool is empty).

This directly targets the problem motivating this addition: RAG examples are deliberately framed as a style reference, not a hard constraint (`fix-rag-question-generation` Decision 2), and are entirely absent for any sub-category with a thin or empty indexed pool — which, immediately after sub-categories are introduced, is most of them. Without an explicit instruction, the LLM had no signal at all about which sub-category it was generating for beyond an opaque slug that never even reached the prompt, so generated content could easily drift from the intended sub-category.

*Alternative considered*: Rely solely on RAG examples (already filtered by sub-category) to implicitly steer style, without adding an explicit instruction. Rejected — this is exactly the status quo that produces mismatched "wrong sub-category" content in practice, especially for sub-categories with few or zero indexed examples so far.

Since `description` is optional at the schema level (Decision 1), a pre-existing sub-category that hasn't been backfilled yet has an empty description; the prompt section degrades to a name-only instruction (`SUB-CATEGORY FOCUS: This question must be about "<name>".`) rather than rendering a blank/awkward description clause.

## Risks / Trade-offs

- [Fan-out indexing (Decision 5) multiplies OpenSearch document count for heavily-tagged questions] → Bounded by how many sub-categories a single question is realistically tagged with (expected low single digits); negligible at current/expected index sizes, consistent with the low-cost assessment already made for pool-size increases in `fix-rag-question-generation`.
- [Round-robin distribution (Decision 6) can request very small pools per sub-category as N grows (e.g. count=5 across 8 sub-categories)] → Existing "use all available if fewer than `ragExampleLimit`" graceful-degradation behavior from `fix-rag-question-generation` already handles thin pools; a sub-category with zero indexed+tagged examples yet just falls back to the structural-constraints-only prompt (no RAG section) for its share, same as any cold-start topic today.
- [Blocking delete on in-use sub-categories (Decision 3) could leave stale/unwanted taxonomy entries if admins don't bother untagging] → Acceptable default; can be revisited with a "force delete + cascade untag" option later if this proves to be friction in practice (explicitly listed as Open Question below).
- [No back-fill of existing questions/indexed docs means early sub-category coverage will be sparse] → Intentional per Non-Goals; coverage improves organically as admins tag questions and new AI-generated ones are auto-tagged (Decision 6) going forward.
- [A required-but-unvalidated description could still be low-quality (e.g. a single vague word) and fail to steer the LLM effectively] → Non-empty is a minimum bar, not a quality guarantee; acceptable starting point — revisit with description-quality guidance or examples in the admin UI if this proves insufficient in practice.

## Migration Plan

- Mongo: new `subcategories` collection created on first write (no migration script needed, consistent with existing Mongoose auto-collection behavior); `Question.subCategories` defaults to `[]` for all existing documents (no explicit backfill migration required — Mongoose treats a missing array field as absent/empty).
- `description` back-fill: `SubCategory` documents created before this field existed (this project's sub-category taxonomy has already shipped and is in use) simply have no `description` — the schema field is optional, so no migration script is needed. Admin/Teacher can backfill one at any time via the new `PATCH /api/subcategories/:id` endpoint, surfaced inline in the sub-category picker (Decision 7). Until backfilled, generation (Decision 9) falls back to a name-only "SUB-CATEGORY FOCUS" instruction for that sub-category (empty description omitted from the prompt rather than rendered as blank guidance).
- OpenSearch: mapping update (additive field) applied via existing index-management path in `vector-index.service.ts`; no full reindex required for the change to deploy safely, though sub-category-filtered retrieval will only surface newly (re-)indexed, tagged documents.
- Rollout: straightforward code deploy (API + admin-app); no destructive schema changes.
- Rollback: revert the deploy; the `subcategories` collection and `subCategories` field can remain unused/ignored if rolled back (no cleanup required for a clean rollback).

## Open Questions

- Should `DELETE /api/subcategories/:id` eventually support a "force" cascade-untag mode, or is the hard block (Decision 3) sufficient long-term? Leaning toward starting with the hard block and revisiting based on real admin usage.
- Should sub-category slugs be globally unique across all category+difficulty pairs (simpler mental model) rather than scoped per pairing (more flexible, allows reuse of names like "Word Problems")? Current design scopes per pairing per the proposal's framing ("sub categories/tags per question types and difficulty level"); to confirm during implementation if this causes admin UX confusion (e.g. same-named sub-category appearing to "not carry over" between difficulty tiers).
- Should the round-robin distribution in Decision 6 become weighted (e.g. favor sub-categories with fewer previously-generated questions) rather than even, once usage data exists? Out of scope for this change; even distribution is the simplest correct starting point.

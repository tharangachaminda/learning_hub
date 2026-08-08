## 1. Sub-category data model

- [x] 1.1 Create `api/src/app/subcategories/schemas/subcategory.schema.ts` (`SubCategory`: `category`, `difficulty`, `name`, `slug`, `createdBy`, timestamps) with compound unique index on `{ category, difficulty, slug }`
- [x] 1.2 Add `subCategories: string[]` (default `[]`) to `Question` schema in `api/src/app/questions/schemas/question.schema.ts`, plus index `{ category: 1, 'metadata.difficulty': 1, subCategories: 1 }`

## 2. Sub-category CRUD API

- [x] 2.1 Create `CreateSubCategoryDto`/`FindSubCategoriesDto` (validate `category` against `QUESTION_CATEGORIES` keys, `difficulty` against `easy`/`medium`/`hard`)
- [x] 2.2 Implement `SubCategoriesService`: `create` (server-side slug derivation, 409 on duplicate within category+difficulty), `list(category, difficulty)`, `delete(id)` (409 if any `Question` references the slug for that category+difficulty)
- [x] 2.3 Implement `SubCategoriesController` with `JwtAuthGuard` + `RolesGuard` + `@Roles('admin', 'teacher')`: `GET /api/subcategories`, `POST /api/subcategories`, `DELETE /api/subcategories/:id`
- [x] 2.4 Register `SubCategoriesModule` in `api/src/app/app.module.ts`
- [x] 2.5 Add `subCategories?: string[]` to `UpdateQuestionDto` and `CreateQuestionDto` so tagging/untagging happens via existing question create/update endpoints

## 3. OpenSearch indexing

- [x] 3.1 Add `subCategory: { type: 'keyword' }` to `getIndexMapping()` in `api/src/app/opensearch/vector-index.service.ts`
- [x] 3.2 Update `QuestionIndexingService` to fan out one OpenSearch document per `(questionId, subCategory)` pair when `subCategories` is non-empty (doc id `${questionId}#${slug}`), falling back to a single document with no `subCategory` value when empty

## 4. RAG retrieval filter

- [x] 4.1 Add `subCategory?: string` to `SemanticSearchService.SearchFilters`
- [x] 4.2 Extend `buildFilterClauses`/`buildKnnQuery` in `semantic-search.service.ts` with an exact-term filter on `metadata.subCategory` (mirror the existing `difficulty` filter)
- [x] 4.3 Update `retrieveRAGContext` in `api/src/app/ai/ollama.service.ts` to accept an optional `subCategory` parameter and pass it through to `findSimilar`

## 5. Generation orchestration

- [x] 5.1 In `math-question-generator.service.ts`, resolve the target category for the requested topic (existing `QUESTION_TYPE_TO_CATEGORY`) and call `SubCategoriesService.list(category, difficulty)` before generation
- [x] 5.2 When the sub-category list is empty, keep current single-pool generation behavior unchanged (no `subCategory` filter)
- [x] 5.3 When non-empty, distribute the requested `count` round-robin across all sub-categories (remainder to the first N) and call `retrieveRAGContext`/generate once per sub-category share
- [x] 5.4 Tag each generated `Question` with its originating sub-category slug before persisting

## 6. Admin/Teacher UI — sub-category tagging

- [x] 6.1 Add a sub-category multi-select (chip list) component to `apps/admin-app/src/app/features/create-question/create-question.ts`, loading options from `GET /api/subcategories?category=&difficulty=` keyed on the question's derived category + selected difficulty
- [x] 6.2 Wire chip toggle add/remove to the question's `subCategories` field on save
- [x] 6.3 Add inline "+ create new sub-category" input that calls `POST /api/subcategories` and adds the result to the current selection
- [x] 6.4 Reuse the same sub-category picker/creation UI in `apps/admin-app/src/app/features/generate-questions/generate-questions.ts` (read-only awareness of available sub-categories; no manual selection needed since generation auto-distributes, but useful for visibility)

## 7. Testing

- [x] 7.1 Unit tests for `SubCategoriesService` (create/duplicate-conflict/list/delete-blocked-when-in-use)
- [x] 7.2 Unit tests for `SemanticSearchService` `subCategory` filter (`buildFilterClauses`)
- [x] 7.3 Update `scripts/test-semantic-search.ts` / `scripts/test-filters.ts` to cover `subCategory` filtering
- [x] 7.4 Unit tests for round-robin distribution logic in the generation orchestration (even split, remainder handling, empty-sub-category-list fallback)
- [x] 7.5 Admin UI test for tag add/remove/inline-create flow on the question form

## 8. Sub-category description

- [x] 8.1 Add `description?: string` to `SubCategory` schema (`api/src/app/subcategories/schemas/subcategory.schema.ts`) — optional at the schema level so pre-existing documents remain valid without a migration
- [x] 8.2 Require `description` (non-empty) on `CreateSubCategoryDto`; reject creation with a validation error when missing/empty
- [x] 8.3 Add `UpdateSubCategoryDto` (`description`, required non-empty) and `SubCategoriesService.update(id, description)`; add `PATCH /api/subcategories/:id` on `SubCategoriesController` (admin/teacher guarded), updating only `description` — `category`/`difficulty`/`name`/`slug` stay immutable
- [x] 8.4 Update `SubCategoriesService.create` to persist `description`
- [x] 8.5 Update admin-app `SubCategoryItem` (add `description`), `createSubCategory` (auth.service.ts), and add `updateSubCategory` (auth.service.ts)
- [x] 8.6 Update `SubCategoryPickerComponent`'s inline "+ create new" flow to capture and submit a `description` alongside the name
- [x] 8.7 Add an inline "add/edit description" affordance in `SubCategoryPickerComponent` for chips missing a description, calling the new `PATCH` endpoint — surfaced wherever the interactive (non-read-only) picker is used, most usefully on the question edit screen (`question-detail.ts`)
- [x] 8.8 Pass the resolved sub-category's `name` + `description` (not just its slug) from `MathQuestionGenerator`'s round-robin assignment through to `OllamaService.generateMathQuestion`
- [x] 8.9 Add a new "SUB-CATEGORY FOCUS" prompt section in `ollama.service.ts`, built from the assigned sub-category's name + description (name-only when description is empty), included even when no RAG examples are available for that sub-category
- [x] 8.10 Unit tests: DTO validation (empty description rejected on create and update), `SubCategoriesService.update` (backfill + revise + immutability of other fields), prompt assembly includes the sub-category focus section with/without RAG examples and with/without a description

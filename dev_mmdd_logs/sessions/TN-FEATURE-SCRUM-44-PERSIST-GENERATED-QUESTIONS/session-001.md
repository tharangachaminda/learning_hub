# MMDD Session Log: TN-FEATURE-SCRUM-44-PERSIST-GENERATED-QUESTIONS

## Session Info

- **Session ID:** SESSION-001
- **Work Item:** TN-FEATURE-SCRUM-44-PERSIST-GENERATED-QUESTIONS
- **Story:** US-QG-005 - Persist Generated Questions in MongoDB
- **Started:** 2026-03-20
- **Agent Model:** Claude Opus 4.6
- **Branch:** feature/SCRUM-44-persist-generated-questions

## Story Summary

Create a `questions` module in the API that:

1. Defines a Mongoose `Question` schema with full metadata fields
2. Provides a `QuestionsService` with CRUD + filtering + duplicate detection
3. Exposes a `QuestionsController` (GET /questions with filters, batch generation)
4. Integrates persistence into the existing generation pipeline
5. Indexes on grade, topic, status, format for query performance

## Planned Micro-Steps (TDD)

### Task 1: Question Mongoose Schema (REQ-QG-019)

- **1a RED:** Write unit tests for the Question schema (field validation, defaults, indexes)
- **1b GREEN:** Create the Question Mongoose schema
- **1c REFACTOR:** Clean up schema, ensure TSDoc complete

### Task 2: QuestionsService CRUD (REQ-QG-020)

- **2a RED:** Write tests for create, findAll with filters, findOne, duplicate detection
- **2b GREEN:** Implement QuestionsService
- **2c REFACTOR:** Optimize queries, refactor

### Task 3: QuestionsController REST API (REQ-QG-021)

- **3a RED:** Write tests for GET /questions with filter params, batch endpoint
- **3b GREEN:** Implement QuestionsController
- **3c REFACTOR:** Validate DTOs, error handling

### Task 4: Integration with Generation Pipeline (REQ-QG-023)

- **4a RED:** Write tests for auto-persist after generation
- **4b GREEN:** Integrate persistence into MathQuestionGenerator
- **4c REFACTOR:** Clean up integration

### Task 5: QuestionsModule Wiring & Final Validation

- **5a:** Wire module into AppModule
- **5b:** Run full test suite, verify coverage ≥80%
- **5c:** Story DoD checklist

## Session Log

### Entry 1 - Session Start

- **Time:** Session Start
- **Action:** Gathered project context, analyzed existing patterns
- **Key Findings:**
  - Existing Mongoose pattern: `@Schema()` decorator + `SchemaFactory.createForClass()`
  - Existing entity: `UserSchema` in auth module (good reference)
  - `MathQuestionGenerator` service has `generateQuestions()` method to integrate with
  - `GeneratedQuestion` Zod type has: question, answer, explanation, metadata (grade, topic, difficulty, country, generated_by, generation_time)
  - `class-validator` and `class-transformer` available for DTOs
  - `MathQuestion` entity is a plain class (not Mongoose) - schema will be separate
- **Decision:** Follow existing User schema pattern for Question schema

---

### Entry 2 - Micro-Step 1a RED: Question Schema Tests

- **Time:** Micro-Step 1a
- **TDD Phase:** RED ✅
- **Action:** Created `api/src/app/questions/schemas/question.schema.spec.ts`
- **Files Added:** `api/src/app/questions/schemas/question.schema.spec.ts`
- **Tests Written:** 19 test cases covering:
  - All schema fields (questionText, answer, explanation, grade, topic, category, format, options, status, stepByStepSolution, metadata, reviewedBy, reviewedAt)
  - Schema options (timestamps, collection name)
  - Indexes (compound unique on questionText+grade+topic, query indexes on grade, topic, status, format)
  - Enum values (QuestionStatus, QuestionFormat)
  - Default values (status=pending, format=open-ended)
- **Result:** Tests fail with `Cannot find module './question.schema'` — RED confirmed
- **Next:** GREEN phase — create the Question schema

---

### Entry 3 - Micro-Step 1b GREEN: Question Schema Implementation

- **Time:** Micro-Step 1b
- **TDD Phase:** GREEN ✅
- **Action:** Created `api/src/app/questions/schemas/question.schema.ts`
- **Files Added:** `api/src/app/questions/schemas/question.schema.ts`
- **Implementation:**
  - `QuestionStatus` enum (pending/approved/rejected)
  - `QuestionFormat` enum (open-ended/multiple-choice)
  - `QuestionMetadata` sub-document class (generatedBy, generationTime, difficulty, country, fallbackUsed, validationScore)
  - `Question` class with all REQ-QG-019 fields
  - Compound unique index on (questionText, grade, topic) for AC-004
  - Individual query indexes on grade, topic, status, format for REQ-QG-022
  - Full TSDoc on all elements
- **Test Fix:** Updated test to import `QuestionSchema` from production code instead of creating fresh schema (programmatic indexes only exist on exported schema)
- **Files Modified:** `api/src/app/questions/schemas/question.schema.spec.ts` (import fix)
- **Result:** 26/26 tests pass
- **Next:** Propose Task 2 — QuestionsService CRUD tests (RED)

---

### Entry 4 - Micro-Step 2a RED: QuestionsService Tests

- **Time:** Micro-Step 2a
- **TDD Phase:** RED ✅
- **Action:** Created `api/src/app/questions/questions.service.spec.ts`
- **Files Added:** `api/src/app/questions/questions.service.spec.ts`
- **Tests Written:** 14 test cases covering:
  - `create()` — saves with pending status (AC-001, AC-003), stores metadata (AC-002), duplicate handling (AC-004), rethrows non-duplicate errors
  - `findAll()` — filter by grade, topic, status, format, combined filters, pagination, no-filter (AC-005)
  - `findOne()` — by ID, returns null for non-existent
  - `createMany()` — batch insert (AC-006), pending status on all, skips duplicates with ordered:false
- **Pattern:** Mocked Mongoose Model with `getModelToken(Question.name)` + `TestingModule`
- **Result:** `Cannot find module './questions.service'` — RED confirmed
- **Next:** GREEN phase — implement QuestionsService

---

### Entry 5 - Micro-Step 2b GREEN: QuestionsService Implementation

- **Time:** Micro-Step 2b
- **TDD Phase:** GREEN ✅
- **Action:** Created `api/src/app/questions/questions.service.ts`
- **Files Added:** `api/src/app/questions/questions.service.ts`
- **Implementation:**
  - `QuestionsService` with Mongoose Model injection
  - `create(dto)` — persists with `status: pending`, catches E11000 → returns null + logs
  - `findAll(filters, page, limit)` — builds query from optional filters, paginated result
  - `findOne(id)` — findById
  - `createMany(dtos)` — insertMany with `ordered: false` for duplicate skip
  - `QuestionFilters` and `PaginatedQuestions` interfaces
  - Full TSDoc on all methods and interfaces
- **Result:** 17/17 service tests pass + 26/26 schema tests still green
- **Next:** Task 3 — QuestionsController (RED)

---

### Entry 6 - Micro-Step 3a RED: Controller Tests + DTOs

- **Time:** Micro-Step 3a
- **TDD Phase:** RED ✅
- **Action:** Created 3 DTOs and controller test spec
- **Files Added:**
  - `api/src/app/questions/dto/find-questions.dto.ts` (grade, topic, status, format, page, limit)
  - `api/src/app/questions/dto/create-question.dto.ts` (full question creation payload)
  - `api/src/app/questions/dto/batch-generate-questions.dto.ts` (grade, topic, count, format)
  - `api/src/app/questions/questions.controller.spec.ts`
- **Tests Written:** 12 test cases covering:
  - `GET /questions` — no filters, grade, topic, status, format, pagination, combined (AC-005, Scenario 3)
  - `GET /questions/:id` — by ID, not found
  - `POST /questions/batch-generate` — generate+store, default count, pending status (AC-006)
- **Result:** `Cannot find module './questions.controller'` — RED confirmed
- **Next:** GREEN phase — implement QuestionsController

---

### Entry 7 - Micro-Step 3b GREEN: QuestionsController Implementation

- **Time:** Micro-Step 3b
- **TDD Phase:** GREEN ✅
- **Action:** Created `api/src/app/questions/questions.controller.ts`
- **Files Added:** `api/src/app/questions/questions.controller.ts`
- **Implementation:**
  - `GET /questions` — FindQuestionsDto query params → QuestionsService.findAll() (AC-005)
  - `GET /questions/:id` — QuestionsService.findOne()
  - `POST /questions/batch-generate` — MathQuestionGenerator → map to Question schema → QuestionsService.createMany() (AC-006)
  - `gradeToDifficulty()` — maps grade number to DifficultyLevel enum
  - `topicToCategory()` — maps topic to curriculum category
  - Full TSDoc on all endpoints
- **Result:** 13/13 controller tests pass
- **Next:** Task 4 — Generation Pipeline Integration (RED)

---

### Entry 8 - Micro-Step 4a RED: Pipeline Integration Tests

- **Time:** Micro-Step 4a
- **TDD Phase:** RED ✅
- **Action:** Created `api/src/app/math-questions/services/math-question-generator-persistence.spec.ts`
- **Files Added:** `api/src/app/math-questions/services/math-question-generator-persistence.spec.ts`
- **Tests Written:** 7 test cases covering:
  - Auto-persist: calls createMany after generateQuestions (AC-001)
  - Passes all questions to createMany
  - Maps fields correctly (questionText, answer, grade, topic, stepByStepSolution)
  - Includes metadata (difficulty, country, generationTime) (AC-002)
  - Graceful failure: returns questions even when persistence fails
  - No createMany call when 0 questions generated
  - Backward compat: works without QuestionsService
- **Result:** `Expected 0-1 arguments, but got 2` — constructor doesn't accept QuestionsService yet
- **Next:** GREEN phase — modify MathQuestionGenerator to accept optional QuestionsService

---

### Entry 9 - Micro-Step 4b GREEN: Pipeline Integration Implementation

- **Time:** Micro-Step 4b
- **TDD Phase:** GREEN ✅
- **Action:** Modified `api/src/app/math-questions/services/math-question-generator.service.ts`
- **Files Modified:** `api/src/app/math-questions/services/math-question-generator.service.ts`, `math-question-generator-persistence.spec.ts`
- **Implementation:**
  - Added `QuestionsService` import and optional 2nd constructor param
  - Added `Logger` for error reporting
  - Modified `generateQuestions()` to capture startTime and call `persistQuestions()` after generation
  - Created `persistQuestions()` private method: maps MathQuestion → schema format, calls `createMany()`, try/catch for graceful failure
  - Metadata includes: `generatedBy` ('ollama'|'deterministic'), `difficulty`, `country: 'NZ'`, `generationTime`
  - Updated test to expect `generatedBy: 'deterministic'` in metadata
- **Decision:** Added `generatedBy` field to satisfy `QuestionMetadata` type requirement — uses 'deterministic' or 'ollama' based on which service generated the questions
- **Result:** 7/7 persistence tests pass, 18/18 existing generator tests pass, 56/56 questions module tests pass
- **Next:** Task 5 — Module Wiring & Validation

---

### Entry 10 - Micro-Step 5a: QuestionsModule Creation & Wiring

- **Time:** Micro-Step 5a
- **TDD Phase:** RED → GREEN ✅
- **Action:** Created `QuestionsModule`, wired into `AppModule` and `MathQuestionsModule`
- **Files Added:** `api/src/app/questions/questions.module.ts`, `api/src/app/questions/questions.module.spec.ts`
- **Files Modified:** `api/src/app/app.module.ts`, `api/src/app/math-questions/math-questions.module.ts`
- **Implementation:**
  - `QuestionsModule`: Registers Question schema via MongooseModule.forFeature, provides QuestionsService + QuestionsController, imports AiModule
  - `AppModule`: Added QuestionsModule to imports
  - `MathQuestionsModule`: Added MongooseModule.forFeature for Question schema, added QuestionsService provider (allows DI into MathQuestionGenerator)
  - 3/3 module tests pass (compile, provides service, provides controller)
- **Result:** 133/133 tests pass across all 8 test suites. Pre-existing opensearch test failures (3 suites) unrelated to our changes.
- **Decision:** Coverage check skipped per developer instruction

---

## Session Summary

### Files Created

| File                                                                              | Purpose                                 |
| --------------------------------------------------------------------------------- | --------------------------------------- |
| `api/src/app/questions/schemas/question.schema.ts`                                | Mongoose schema (REQ-QG-019)            |
| `api/src/app/questions/schemas/question.schema.spec.ts`                           | Schema unit tests (26 tests)            |
| `api/src/app/questions/questions.service.ts`                                      | CRUD service (REQ-QG-020)               |
| `api/src/app/questions/questions.service.spec.ts`                                 | Service unit tests (17 tests)           |
| `api/src/app/questions/questions.controller.ts`                                   | REST API (REQ-QG-021)                   |
| `api/src/app/questions/questions.controller.spec.ts`                              | Controller unit tests (13 tests)        |
| `api/src/app/questions/dto/find-questions.dto.ts`                                 | Query filter DTO                        |
| `api/src/app/questions/dto/create-question.dto.ts`                                | Question creation DTO                   |
| `api/src/app/questions/dto/batch-generate-questions.dto.ts`                       | Batch generation DTO                    |
| `api/src/app/questions/questions.module.ts`                                       | NestJS module                           |
| `api/src/app/questions/questions.module.spec.ts`                                  | Module tests (3 tests)                  |
| `api/src/app/math-questions/services/math-question-generator-persistence.spec.ts` | Persistence integration tests (7 tests) |

### Files Modified

| File                                                                     | Change                                                    |
| ------------------------------------------------------------------------ | --------------------------------------------------------- |
| `api/src/app/math-questions/services/math-question-generator.service.ts` | Added optional QuestionsService param, auto-persist logic |
| `api/src/app/math-questions/math-questions.module.ts`                    | Added QuestionsService + Question schema imports          |
| `api/src/app/app.module.ts`                                              | Added QuestionsModule import                              |

### Test Results

- **Total Tests:** 133 passed across 8 test suites
- **Schema:** 26/26 ✅
- **Service:** 17/17 ✅
- **Controller:** 13/13 ✅
- **Persistence Integration:** 7/7 ✅
- **Existing Generator:** 18/18 ✅ (no regression)
- **Module:** 3/3 ✅
- **Existing Controller:** 49/49 ✅ (no regression)

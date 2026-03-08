# Epic: Full-Grade Question Generation & Management

**Epic ID:** EP-QG-008  
**Priority:** P0 (Critical)  
**Status:** PLANNED  
**Dependencies:** Ollama LLM Integration (US-SI-002), Basic Question Generation (US-QG-001)

---

## Epic Overview

Expand the question generation backend from its current Grade 3 Addition-only capability to support **all grades (3–8)**, **all math topics** defined in the curriculum, and **all question format types** (MCQ, fill-in-blank, word problems, drag-and-drop). Additionally, introduce **MongoDB persistence** for generated questions and an **admin/teacher approval workflow** so that only reviewed questions reach students.

### Epic Goals

1. **Full Grade Coverage**: Generate questions for Grades 3–8 using the AI (Ollama) path
2. **Full Topic Coverage**: Support all 50 math topics defined in `GRADE_TOPICS` across all grades
3. **Multiple Question Formats**: Support MCQ, fill-in-blank, word problems, and drag-and-drop
4. **LaTeX Math Notation**: Generate all math expressions in LaTeX format for proper rendering
5. **Question Persistence**: Store all generated questions in MongoDB for reuse without re-generating via LLM
6. **Approval Workflow**: Admin/teacher review and approval gate before questions are available to students

---

## Business Value

**Current State (Pre-Epic):**

- ❌ Only Grade 3 Addition works end-to-end
- ❌ Subtraction throws "not yet implemented"
- ❌ Only open-answer format (`"5 + 3 = ?"`)
- ❌ Questions generated on-the-fly, never stored
- ❌ No review process — all generated content goes directly to students

**Future State (Post-Epic):**

- ✅ Grades 3–8 fully supported with curriculum-aligned generation
- ✅ All 50 math topics available per grade
- ✅ MCQ, fill-in-blank, word problem, and drag-and-drop formats
- ✅ All math expressions in LaTeX format, rendered by KaTeX on the frontend
- ✅ Generated questions persisted in MongoDB and reusable
- ✅ Admin/teacher approval gate ensures quality before student access

### ROI Impact

- **Cost Efficiency**: Reuse stored questions instead of calling LLM for every request
- **Quality Assurance**: Human review ensures only high-quality questions reach students
- **Content Breadth**: 50 topics × 6 grades × 4 formats = massive question bank
- **Curriculum Coverage**: Full NZ Mathematics Curriculum Phase 1–3 alignment

---

## Technical Architecture

### Question Generation & Approval Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Admin/Teacher   │    │   NestJS        │    │  AI Question    │
│  Triggers        │───▶│   Controller    │───▶│  Generator      │
│  Generation      │    │  (Grade 3-8,   │    │  (Ollama LLM)   │
│                  │    │   All Topics)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   MongoDB       │
                                              │   (status:      │
                                              │    pending)     │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Admin/Teacher  │
                                              │   Reviews &     │
                                              │   Approves      │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   MongoDB       │
                                              │   (status:      │
                                              │    approved)    │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Student       │
                                              │   Practices     │
                                              │   (approved Qs) │
                                              └─────────────────┘
```

---

## Stories in this Epic

| Story ID  | Title                                     | Priority | Points | Dependencies |
| --------- | ----------------------------------------- | -------- | ------ | ------------ |
| US-QG-003 | Extend Grade Support to Grades 3–8        | P0       | 5      | —            |
| US-QG-004 | Enable All Math Topics per Grade          | P0       | 8      | US-QG-003    |
| US-QG-005 | Persist Generated Questions in MongoDB    | P0       | 8      | US-QG-003    |
| US-QG-006 | Admin/Teacher Question Approval Workflow  | P0       | 8      | US-QG-005    |
| US-QG-007 | Support Multiple-Choice Question Format   | P1       | 5      | US-QG-004    |
| US-QG-008 | Support Fill-in-the-Blank Question Format | P1       | 3      | US-QG-004    |
| US-QG-009 | Support Word Problem Question Format      | P1       | 5      | US-QG-004    |
| US-QG-010 | Support Drag-and-Drop Question Format     | P2       | 8      | US-QG-004    |
| US-QG-011 | LaTeX Math Expression Support             | P0       | 5      | US-QG-003    |

### Suggested Implementation Order

1. **US-QG-003** (Grades 3–8) — foundational; unblocks everything
2. **US-QG-011** (LaTeX support) — cross-cutting; should be integrated early so all subsequent content uses LaTeX
3. **US-QG-004** (All topics) — opens the full topic matrix
4. **US-QG-005** (MongoDB persistence) — can be parallel with US-QG-004
5. **US-QG-006** (Approval workflow) — depends on persistence
6. **US-QG-007** (MCQ) — highest-value format
7. **US-QG-009** (Word problems) — natural fit for AI
8. **US-QG-008** (Fill-in-blank) — quick win
9. **US-QG-010** (Drag-and-drop) — most complex format

Stories 3–4 (persistence + approval) are independent of stories 5–8 (formats) and **can be worked in parallel**.

---

## Key Files Requiring Changes

| File                                                                     | Purpose                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `api/src/app/math-questions/entities/math-question.entity.ts`            | `DifficultyLevel`, `OperationType` enums, entity model |
| `api/src/app/math-questions/math-questions.controller.ts`                | Routing, validation, grade/topic parsing               |
| `api/src/app/math-questions/services/math-question-generator.service.ts` | Generation orchestration                               |
| `api/src/app/ai/ollama.service.ts`                                       | AI prompt construction and response parsing            |
| `api/src/app/ai/schemas.ts`                                              | Zod schemas, `GRADE_LEVEL_PATTERNS`                    |
| `api/src/app/ai/curriculum-prompt-engine.ts`                             | Curriculum-aware prompt building, LaTeX style guide    |
| `api/src/app/ai/curriculum.types.ts`                                     | `GRADE_TOPICS` mappings (already complete)             |

## Notes

- The AI path (Ollama LLM) already accepts any grade/topic string — the main blockers are enum/validation gates in the controller and entity layers
- The `GRADE_TOPICS` mapping in `curriculum.types.ts` already defines all 50 topics across grades 3–8
- The `ai_education_questions_dataset.json` contains ~23K seed questions that can be loaded into MongoDB as pre-approved content

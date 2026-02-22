---
name: bmad-product
description: 'Product management and ownership skills. USE WHEN creating PRDs, epics, user stories, sprint planning, backlog management, story refinement, acceptance criteria definition, or feature prioritization. Covers both greenfield and brownfield scenarios.'
---

# BMAD Product Management & Ownership

This skill supports the PM (John), PO (Sarah), and SM (Bob) agents for product documentation and backlog management.

## Templates

| Template       | File                                             | Use Case                      |
| -------------- | ------------------------------------------------ | ----------------------------- |
| PRD            | `.codei-core/templates/prd-tmpl.yaml`            | Product Requirements Document |
| Brownfield PRD | `.codei-core/templates/brownfield-prd-tmpl.yaml` | PRD for existing systems      |
| Story          | `.codei-core/templates/story-tmpl.yaml`          | User story creation           |

## Tasks

| Task                    | File                                           | Used By    |
| ----------------------- | ---------------------------------------------- | ---------- |
| Create Next Story       | `.codei-core/tasks/create-next-story.md`       | SM         |
| Brownfield Create Epic  | `.codei-core/tasks/brownfield-create-epic.md`  | PM         |
| Brownfield Create Story | `.codei-core/tasks/brownfield-create-story.md` | PM         |
| Validate Next Story     | `.codei-core/tasks/validate-next-story.md`     | PO, Dev    |
| Shard Document          | `.codei-core/tasks/shard-doc.md`               | PM, PO     |
| Correct Course          | `.codei-core/tasks/correct-course.md`          | PM, PO, SM |

## Checklists

| Checklist             | File                                              | Used By |
| --------------------- | ------------------------------------------------- | ------- |
| PM Checklist          | `.codei-core/checklists/pm-checklist.md`          | PM      |
| PO Master Checklist   | `.codei-core/checklists/po-master-checklist.md`   | PO      |
| Story Draft Checklist | `.codei-core/checklists/story-draft-checklist.md` | SM      |
| Story DoD Checklist   | `.codei-core/checklists/story-dod-checklist.md`   | Dev     |
| Change Checklist      | `.codei-core/checklists/change-checklist.md`      | PM, PO  |

## Project Docs

- PRD: `docs/prd.md` (sharded to `docs/prd/`)
- Stories: `docs/stories/`
- Epic file pattern: `epic-{n}*.md`

## PM Commands

- `*create-prd` — Create product requirements document
- `*create-brownfield-prd` — PRD for existing system
- `*create-epic` / `*create-brownfield-epic` — Create epic
- `*create-story` / `*create-brownfield-story` — Create user story
- `*shard-prd` — Split PRD into component documents
- `*correct-course` — Course correction workflow

## PO Commands

- `*create-epic` / `*create-story` — Create epic or story
- `*execute-checklist-po` — Run PO master checklist
- `*validate-story-draft` — Validate a story draft
- `*shard-doc` — Shard a document

## SM Commands

- `*draft` — Draft next story using create-next-story task
- `*story-checklist` — Run story draft checklist

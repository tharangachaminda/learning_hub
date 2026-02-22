---
name: bmad-development
description: 'Development workflow and MMDD methodology. USE WHEN implementing stories, running TDD workflows, debugging, refactoring, generating scaffolding, or managing MMDD sessions. Covers both full implementation (dev, dev-mmtdd) and planning-only (dev-mmtdd-ask) workflows.'
---

# BMAD Development Workflow

This skill supports the Dev (James), Dev-MMTDD (Samare), and Dev-MMTDD-Ask (Samare Ask) agents for development implementation and MMDD methodology.

## MMDD Tasks

| Task                    | File                                           | Description                          |
| ----------------------- | ---------------------------------------------- | ------------------------------------ |
| MMDD Project Setup      | `.codei-core/tasks/mmdd-project-setup.md`      | Initialize MMDD project structure    |
| MMDD Session Management | `.codei-core/tasks/mmdd-session-management.md` | Manage MMDD development sessions     |
| Apply QA Fixes          | `.codei-core/tasks/apply-qa-fixes.md`          | Apply fixes from QA review           |
| Validate Next Story     | `.codei-core/tasks/validate-next-story.md`     | Validate story before implementation |
| Execute Checklist       | `.codei-core/tasks/execute-checklist.md`       | Run development checklists           |

## MMDD Templates

| Template     | File                                            |
| ------------ | ----------------------------------------------- |
| Decision Log | `.codei-core/templates/mmdd-decision-tmpl.md`   |
| Principles   | `.codei-core/templates/mmdd-principles-tmpl.md` |
| Session Log  | `.codei-core/templates/mmdd-session-tmpl.md`    |

## Checklists

| Checklist    | File                                               |
| ------------ | -------------------------------------------------- |
| Story DoD    | `.codei-core/checklists/story-dod-checklist.md`    |
| MMDD Quality | `.codei-core/checklists/mmdd-quality-checklist.md` |

## Dev Always-Load Files

As configured in core-config.yaml, always load these before development:

- `docs/architecture/coding-standards.md`
- `docs/architecture/tech-stack.md`
- `docs/architecture/source-tree.md`

## Dev Agent Commands (James)

- `*develop-story` — Implement a user story
- `*explain` — Explain code or concept
- `*review-qa` — Apply QA review fixes
- `*run-tests` — Execute test suite

## Dev-MMTDD Commands (Samare — implements code)

- `*develop-story` — Full story implementation with TDD (sets status to 'Ready for Review')
- All MMDD project setup and session management commands

## Dev-MMTDD-Ask Commands (Samare Ask — planning only)

- `*develop-story` — Planning and scaffolding only (sets status to 'Ready for Implementation')
- `*generate-scaffolding` — Create interfaces and project structure
- `*generate-instructions` — Create detailed step-by-step implementation instructions

## Story Location

Stories are stored in `docs/stories/` as configured in core-config.yaml.
Debug log: `.ai/debug-log.md`

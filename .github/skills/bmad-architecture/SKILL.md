---
name: bmad-architecture
description: 'Architecture document creation and review. USE WHEN creating system architecture documents, technology selection, API design, infrastructure planning, or reviewing architecture against checklists. Covers full-stack, front-end, back-end, and brownfield architecture patterns.'
---

# BMAD Architecture

This skill supports the Architect agent (Winston) and related agents for architecture document creation and validation.

## Templates

| Template                | File                                                      | Use Case                      |
| ----------------------- | --------------------------------------------------------- | ----------------------------- |
| Full-Stack Architecture | `.codei-core/templates/fullstack-architecture-tmpl.yaml`  | Complete system architecture  |
| Front-End Architecture  | `.codei-core/templates/front-end-architecture-tmpl.yaml`  | UI/client-side architecture   |
| Back-End Architecture   | `.codei-core/templates/architecture-tmpl.yaml`            | Server-side architecture      |
| Brownfield Architecture | `.codei-core/templates/brownfield-architecture-tmpl.yaml` | Existing system modernization |

## Checklists

| Checklist           | File                                            | Description                    |
| ------------------- | ----------------------------------------------- | ------------------------------ |
| Architect Checklist | `.codei-core/checklists/architect-checklist.md` | Architecture review validation |

## Workflows

| Workflow              | File                                              | Use Case                       |
| --------------------- | ------------------------------------------------- | ------------------------------ |
| Greenfield Full-Stack | `.codei-core/workflows/greenfield-fullstack.yaml` | New project setup              |
| Greenfield Service    | `.codei-core/workflows/greenfield-service.yaml`   | New service setup              |
| Greenfield UI         | `.codei-core/workflows/greenfield-ui.yaml`        | New UI project setup           |
| Brownfield Full-Stack | `.codei-core/workflows/brownfield-fullstack.yaml` | Existing project modernization |
| Brownfield Service    | `.codei-core/workflows/brownfield-service.yaml`   | Existing service updates       |
| Brownfield UI         | `.codei-core/workflows/brownfield-ui.yaml`        | Existing UI updates            |

## Project Docs

Architecture documents for this project:

- Main: `docs/architecture.md`
- Sharded location: `docs/architecture/`
- Technical preferences: `.codei-core/data/technical-preferences.md`

## Commands

- `*create-full-stack-architecture` — Use create-doc with fullstack-architecture-tmpl
- `*create-front-end-architecture` — Use create-doc with front-end-architecture-tmpl
- `*create-backend-architecture` — Use create-doc with architecture-tmpl
- `*create-brownfield-architecture` — Use create-doc with brownfield-architecture-tmpl
- `*execute-checklist` — Run architect-checklist validation
- `*shard-prd` — Shard PRD into component documents

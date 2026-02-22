---
name: bmad-ux
description: 'UX design and front-end specification. USE WHEN creating UI/UX designs, wireframes, prototypes, front-end specifications, generating AI frontend prompts (e.g. for v0.dev), or optimizing user experience.'
---

# BMAD UX Design

This skill supports the UX Expert agent (Sally) for UI/UX design and front-end specification creation.

## Tasks

| Task                        | File                                               | Description                                     |
| --------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| Create Document             | `.codei-core/tasks/create-doc.md`                  | General document creation                       |
| Generate AI Frontend Prompt | `.codei-core/tasks/generate-ai-frontend-prompt.md` | Generate prompts for AI UI tools (v0.dev, etc.) |
| Execute Checklist           | `.codei-core/tasks/execute-checklist.md`           | Run validation checklists                       |

## Templates

| Template       | File                                             |
| -------------- | ------------------------------------------------ |
| Front-End Spec | `.codei-core/templates/front-end-spec-tmpl.yaml` |

## Reference Data

| Data                  | File                                        |
| --------------------- | ------------------------------------------- |
| Technical Preferences | `.codei-core/data/technical-preferences.md` |

## UX Agent Commands

- `*create-front-end-spec` — Create front-end specification using template
- `*generate-ui-prompt` — Generate AI frontend prompt for tools like v0.dev

---
name: bmad-elicitation
description: 'BMAD elicitation, brainstorming, and research capabilities. USE WHEN agents need to facilitate brainstorming sessions, perform advanced elicitation, create deep research prompts, or apply structured ideation techniques.'
---

# BMAD Elicitation & Brainstorming

This skill covers structured elicitation, brainstorming facilitation, and research prompt generation used by analyst, orchestrator, and master agents.

## Tasks

| Task                     | File                                                    | Description                                 |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------- |
| Advanced Elicitation     | `.codei-core/tasks/advanced-elicitation.md`             | Structured elicitation using proven methods |
| Facilitate Brainstorming | `.codei-core/tasks/facilitate-brainstorming-session.md` | Run structured brainstorming session        |
| Deep Research Prompt     | `.codei-core/tasks/create-deep-research-prompt.md`      | Generate comprehensive research prompts     |

## Templates

| Template             | File                                                   |
| -------------------- | ------------------------------------------------------ |
| Brainstorming Output | `.codei-core/templates/brainstorming-output-tmpl.yaml` |
| Competitor Analysis  | `.codei-core/templates/competitor-analysis-tmpl.yaml`  |
| Market Research      | `.codei-core/templates/market-research-tmpl.yaml`      |
| Project Brief        | `.codei-core/templates/project-brief-tmpl.yaml`        |

## Reference Data

| Data                     | File                                           |
| ------------------------ | ---------------------------------------------- |
| Brainstorming Techniques | `.codei-core/data/brainstorming-techniques.md` |
| Elicitation Methods      | `.codei-core/data/elicitation-methods.md`      |
| BMAD Knowledge Base      | `.codei-core/data/bmad-kb.md`                  |

## Usage

- Analyst agent (Mary): Use `*brainstorm {topic}`, `*research-prompt {topic}`, `*perform-market-research`, `*create-competitor-analysis`, `*create-project-brief`
- Orchestrator agents: Use `*chat-mode`, `*kb-mode` for interactive elicitation

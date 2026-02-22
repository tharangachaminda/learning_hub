---
name: bmad-testing
description: 'QA, test design, and test quality analysis. USE WHEN performing test architecture review, quality gate decisions, code review for quality, risk profiling, NFR assessment, unit test scoring, or comprehensive test analysis. Used by QA (Quinn) and Test Analyst (Hayden) agents.'
---

# BMAD Testing & Quality Assurance

This skill supports the QA agent (Quinn) and Test Analyst agent (Hayden) for test architecture, quality assessment, and test improvement.

## QA Tasks

| Task                        | File                                               | Description                        |
| --------------------------- | -------------------------------------------------- | ---------------------------------- |
| QA Gate                     | `.codei-core/tasks/qa-gate.md`                     | Quality gate decisions             |
| Review Story                | `.codei-core/tasks/review-story.md`                | Story review for quality           |
| Test Design                 | `.codei-core/tasks/test-design.md`                 | Test architecture design           |
| Risk Profile                | `.codei-core/tasks/risk-profile.md`                | Risk profiling assessment          |
| NFR Assessment              | `.codei-core/tasks/nfr-assess.md`                  | Non-functional requirements review |
| Trace Requirements          | `.codei-core/tasks/trace-requirements.md`          | Requirements traceability          |
| Apply QA Fixes              | `.codei-core/tasks/apply-qa-fixes.md`              | Apply fixes from QA review         |
| Comprehensive Test Analysis | `.codei-core/tasks/comprehensive-test-analysis.md` | Full test suite analysis           |

## Templates

| Template               | File                                                   |
| ---------------------- | ------------------------------------------------------ |
| QA Gate                | `.codei-core/templates/qa-gate-tmpl.yaml`              |
| Story                  | `.codei-core/templates/story-tmpl.yaml`                |
| Test Analysis Report   | `.codei-core/templates/test-analysis-report-tmpl.md`   |
| Test Analysis Tracking | `.codei-core/templates/test-analysis-tracking-tmpl.md` |

## Checklists

| Checklist         | File                                                    |
| ----------------- | ------------------------------------------------------- |
| Unit Test Quality | `.codei-core/checklists/unit-test-quality-checklist.md` |
| Story DoD         | `.codei-core/checklists/story-dod-checklist.md`         |

## Reference Data

| Data                   | File                                         |
| ---------------------- | -------------------------------------------- |
| Test Levels Framework  | `.codei-core/data/test-levels-framework.md`  |
| Test Priorities Matrix | `.codei-core/data/test-priorities-matrix.md` |
| Technical Preferences  | `.codei-core/data/technical-preferences.md`  |

## Workflows

| Workflow                    | File                                                     |
| --------------------------- | -------------------------------------------------------- |
| Comprehensive Test Analysis | `.codei-core/workflows/comprehensive-test-analysis.yaml` |

## QA Agent Commands

- `*gate` — Run quality gate assessment
- `*review` — Review story for quality
- `*test-design` — Create test design
- `*risk-profile` — Assess risk profile
- `*nfr-assess` — Non-functional requirements assessment
- `*trace` — Trace requirements

## Test Analyst Commands

- `*analyze {file-pattern}` — Analyze test files for quality (score 0-100)
- `*checklist` — Execute unit test quality checklist
- `*improve {test-file}` — Generate improvement suggestions for test file

## QA Output Location

QA results are written to `docs/qa/` as configured in `.codei-core/core-config.yaml`.

**Important:** QA agent is ONLY authorized to update the "QA Results" section of story files.

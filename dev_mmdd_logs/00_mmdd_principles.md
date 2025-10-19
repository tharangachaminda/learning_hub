# MMDD (Micromanaged Driven Development) Principles

## Core Methodology

- **Micromanaged Steps**: Break ALL development into ≤30 minute reviewable steps
- **Complete Documentation**: Log every AI interaction with developer decisions
- **Developer Control**: AI suggests, developer decides and approves each step
- **TDD Integration**: MANDATORY Red-Green-Refactor cycles

## TDD Enforcement Rules

- **RED**: Write failing test first - NO EXCEPTIONS
- **GREEN**: Minimal implementation to pass test
- **REFACTOR**: Improve code while keeping tests green
- **Coverage**: Maintain ≥80% test coverage at all times

## Session Structure

- Sessions organized by work item (TN-<BRANCH-NAME>)
- Complete audit trails for maintainability
- Rollback capability at every step
- TSDoc documentation for all functions

## Quality Gates (Every Step)

- [ ] Reviewable by other developers
- [ ] Reversible with safe rollback
- [ ] Documented with rationale
- [ ] TDD compliant
- [ ] Developer approved
- [ ] TSDoc complete

This file indicates MMDD setup is complete for this project.

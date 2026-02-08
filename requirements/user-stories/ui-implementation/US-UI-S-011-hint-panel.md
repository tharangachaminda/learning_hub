# User Story: Hint Panel for AI-Generated Questions

**Story ID:** US-UI-S-011  
**Epic:** EPIC-UI-P1 (Phase 1 - MVP Core UI)  
**Priority:** P1 (High)  
**Story Points:** 3  
**Sprint:** MVP Sprint 2  
**Created:** February 8, 2026  
**Spec Reference:** `docs/technical/ai-question-generator-frontend-spec.md` §5.7

---

## User Story

As a **student user**,  
I want **to reveal a hint for any question when I'm stuck, without leaving the question or making an extra request**,  
So that **I can get help understanding the problem while still trying to solve it myself**.

---

## Story Context

### Existing System Integration

- **Depends on:** US-UI-S-009 (Question Display — renders question cards)
- **Data source:** `GeneratedQuestion.explanation` field — always present in AI-generated output, no API call needed
- **Technology:** Angular 20.x, Angular MDB 5, TypeScript, Signals
- **Touch points:**
  - `HintPanelComponent` (new presentation component)
  - `QuestionCardComponent` (parent — passes `explanation` and emits `hintUsed` event)
  - `StudentAnswer.hintUsed` (tracked for analytics)

### Screen Reference

- **Screen ID:** S1.3.2 — Phase 2, within Question Card
- **Component Path:** `apps/student-app/src/app/features/practice/question-generator/components/hint-panel/`

---

## Acceptance Criteria

### Functional Requirements

1. **Hint Button Display**
   - GIVEN I am viewing a question card
   - WHEN the card renders
   - THEN I see a "💡 Show Hint" text button below the additional notes textarea
   - AND the button uses a subtle, non-distracting style (text link, not primary button)

2. **Hint Expand**
   - GIVEN the hint is collapsed (default state)
   - WHEN I click "💡 Show Hint"
   - THEN a hint panel slides down with a smooth animation (`--animation-normal: 0.3s`)
   - AND the panel shows the `explanation` text from `GeneratedQuestion.explanation`
   - AND the button text changes to "💡 Hide Hint"
   - AND the `hintUsed` flag is set to `true` for this question's `StudentAnswer`

3. **Hint Collapse**
   - GIVEN the hint is expanded
   - WHEN I click "💡 Hide Hint"
   - THEN the hint panel slides up and is hidden
   - AND the button text reverts to "💡 Show Hint"
   - AND the `hintUsed` flag remains `true` (once revealed, always tracked)

4. **Hint Visual Style**
   - GIVEN the hint panel is expanded
   - WHEN I view it
   - THEN it has:
     - Light yellow background (`#fffde7`)
     - Left border using `--accent-color` (#fbbc04, 4 px)
     - Rounded corners (`--border-radius`)
     - 💡 icon before the text
     - Padding: 16 px
   - AND the text is readable (16 px, `--text-primary` colour)

5. **Hint State Persistence**
   - GIVEN I have expanded the hint on question 3
   - WHEN I navigate to question 4 and then back to question 3
   - THEN the hint is still in its expanded state
   - AND the `hintUsed` flag is still `true`

6. **No API Call**
   - GIVEN I click "Show Hint"
   - WHEN the hint renders
   - THEN no network request is made
   - AND the `explanation` text is rendered instantly from the pre-loaded question data

7. **LaTeX in Hints**
   - GIVEN the `explanation` text contains LaTeX expressions
   - WHEN the hint renders
   - THEN LaTeX is rendered via KaTeX (reusing `KatexRenderComponent` from US-UI-S-009)
   - AND fallback to raw text if parsing fails

### Quality Requirements

8. **Performance**
   - Hint expand/collapse: instant (client-side, no API call)
   - Animation duration: 0.3 s (respects `prefers-reduced-motion`)

9. **Accessibility**
   - Toggle button has `aria-expanded="true|false"` attribute
   - Hint panel has `role="region"` and `aria-label="Hint"`
   - Toggle button is focusable and activatable via Enter/Space
   - Screen reader announces "Hint shown" / "Hint hidden" on toggle

10. **Responsive Design**
    - Hint panel is full-width within the question card at all breakpoints
    - Text wraps naturally on narrow screens

11. **Child-Friendly Design**
    - Hint icon (💡) provides visual cue
    - Warm yellow colour is inviting, not alarming
    - Hint text uses simple, age-appropriate language (determined by AI generation)

---

## Technical Notes

### Component Structure

```
question-generator/components/
└── hint-panel/
    ├── hint-panel.ts                  # Presentation component
    ├── hint-panel.html
    ├── hint-panel.css
    └── hint-panel.spec.ts
```

### Component API

```typescript
@Component({ ... })
export class HintPanelComponent {
  // Inputs
  explanation = input.required<string>();   // From GeneratedQuestion.explanation
  isExpanded = input<boolean>(false);       // Initial expanded state

  // Outputs
  hintToggled = output<boolean>();          // Emits new expanded state
  hintRevealed = output<void>();            // Fires once on first reveal
}
```

### MDB 5 Components Used

- `mdb-btn` — Toggle button (text style)

### CSS

```css
.hint-panel {
  background: #fffde7;
  border-left: 4px solid var(--accent-color);
  border-radius: var(--border-radius);
  padding: 16px;
  margin-top: 12px;
  animation: slideDown var(--animation-normal) ease;
}

.hint-panel.collapsed {
  display: none;
}
```

---

## Testing Requirements

### Unit Tests (Jest + Angular Testing Library)

| Test Area | Cases |
|---|---|
| Default state | Hint panel is collapsed on render |
| Show Hint | Click → panel visible, button text changes to "Hide Hint" |
| Hide Hint | Click again → panel hidden, button text changes to "Show Hint" |
| Explanation text | Renders the `explanation` input content |
| LaTeX in hint | LaTeX expressions rendered via KaTeX |
| `hintUsed` event | `hintRevealed` output emits on first reveal only |
| `hintToggled` event | Emits on every toggle with current expanded state |
| State persistence | `isExpanded` input controls initial state correctly |
| No HTTP call | No `HttpClient` usage in component or dependencies |
| `aria-expanded` | Attribute toggles between `true` and `false` |
| `prefers-reduced-motion` | Animation class not applied when motion is reduced |
| Visual style | Yellow background, accent left border, 💡 icon |

### Coverage Target

- **Minimum:** 85% statement coverage
- **Target:** 90%+

---

## Definition of Done

- [ ] "💡 Show Hint" button renders below textarea on every question card
- [ ] Click expands hint panel with slide animation
- [ ] Click again collapses hint panel
- [ ] Hint text comes from `GeneratedQuestion.explanation` (no API call)
- [ ] LaTeX rendering in hint text via KaTeX
- [ ] Button text toggles between "Show Hint" / "Hide Hint"
- [ ] `hintUsed` flag set to `true` on first reveal
- [ ] Hint state persists when navigating between questions
- [ ] Visual style: yellow background, accent border, 💡 icon
- [ ] `aria-expanded` attribute on toggle button
- [ ] Respects `prefers-reduced-motion`
- [ ] Keyboard-accessible (Enter/Space to toggle)
- [ ] Unit tests > 85% coverage
- [ ] Code review completed

---

## Dependencies

### Blockers
- **US-UI-S-009** (Question Display — `QuestionCardComponent` hosts the hint panel)
- `KatexRenderComponent` (from US-UI-S-009 — for LaTeX in hints)

### Related Stories
- **US-UI-S-009:** AI Question Display & Pagination (parent component)
- **US-UI-S-010:** Answer Collection & Batch Submission (tracks `hintUsed`)

---

**Story Owner:** Frontend Team  
**Reviewers:** UX Team, QA Team  
**Estimated Hours:** 10–12 hours  
**Complexity:** Low (single presentation component, no API call)

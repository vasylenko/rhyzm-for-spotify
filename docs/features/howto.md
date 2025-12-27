# How to Write Feature Docs

Process we found efficient for designing features before implementation.

## Structure

```
# Feature: [Name]

## Problem        ← Why this feature exists (1-2 sentences)
## Solution       ← High-level approach (1 sentence)
## UX Design      ← User flows, wireframes (ASCII)
## Architecture   ← System diagrams if needed
## Implementation ← Algorithms (flowcharts, NOT code)
## Edge Cases     ← Table of scenarios + handling
## Decision Log   ← What we decided + why
```

## Principles

### 1. Problem First
Start with the user problem. If you can't explain why in 2 sentences, the feature isn't clear.

### 2. Diagrams Over Code
Use ASCII flowcharts and diagrams. Code locks you into implementation details too early.

```
Good:
  User taps button
    │
    └─► Show modal
          ├─► Option A → do X
          └─► Option B → do Y

Bad:
  function handleClick() {
    showModal({...})
  }
```

### 3. Explain Why
Every decision needs rationale. Future you will forget why you chose X over Y.

```
Good:
| Decision | Rationale |
|----------|-----------|
| Edit button (not long-press) | Simpler - no timers, no touch conflicts |

Bad:
"We'll use an edit button."
```

### 4. KISS
If something feels complicated, it probably is. Ask: "What's the simplest thing that works?"

Signs of over-engineering:
- New abstractions for 2 consumers
- "Future flexibility" without concrete use case
- More than 5-6 files to change

### 5. Review for Shit That Will Hit the Vent
After drafting, do a fresh review asking:
- Does this align with existing code?
- What happens when X fails?
- What about edge case Y?
- Any timing/race conditions?
- CORS, auth, error handling covered?

Document findings. Fix the real issues, skip the theoretical ones.

## Process

```
1. Draft structure
     │
2. Write Problem + Solution
     │
3. Design UX flows (ASCII diagrams)
     │
4. Write implementation algorithms (flowcharts)
     │
5. List files to change
     │
6. Add edge cases table
     │
7. Document decisions with rationale
     │
8. Fresh review: "what could go wrong?"
     │
9. Address real issues, skip theoretical ones
     │
10. Commit
```

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Write actual code in feature doc | Write algorithms/flowcharts |
| Add features "while we're at it" | Stick to the problem stated |
| Skip the "why" | Every decision needs rationale |
| Plan for 1000 users when you have 0 | Build for now, document future ideas |
| Create abstractions for 2 consumers | Keep it inline until 3+ |
| Ignore existing patterns in codebase | Align with what's already there |

## Example Features

- `TODO-support-multiple-browsers.md` - Backend/API feature
- `TODO-scene-edit.md` - Frontend/UI feature

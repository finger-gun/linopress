## Why

Users often start with underspecified prompts and only discover missing details after a weak first result. Adding contextual prompt guidance during writing can improve input quality early, reduce correction loops, and keep the flow fast by avoiding network-dependent hint generation.

## What Changes

- Add in-composer contextual tips that present one suggestion at a time while the user writes in the prompt textarea.
- Compute tip selection fully client-side using deterministic prompt analysis (no network calls for hinting).
- Prioritize missing high-value brief details (e.g., audience, goals, style, key sections) and rotate suggestions as prompt context evolves.
- Include interaction rules to keep tips stable and non-disruptive (debounce updates, avoid rapid flipping, suppress immediate repeats).
- Keep existing submit behavior and MVP constraints intact; this change only augments writing assistance UX.

## Capabilities

### New Capabilities
- `contextual-prompt-tips`: Real-time, local, single-tip guidance that adapts to prompt content and encourages more complete briefs without server communication.

### Modified Capabilities
- `frontend-index-mvp-ui`: Extend the index page prompt composer behavior with dynamic writing guidance and associated UX expectations.

## Impact

- Affected code: `app/src/app/components/PromptComposer.tsx`, related component styles/modules, and any route-local composition wiring in `app/src/app/page.tsx`.
- APIs: no backend/API contract changes; no external service dependency added.
- Dependencies: no required runtime service dependency; optional internal utility module(s) for tip rules/scoring.
- Systems: frontend-only behavior change, preserving sandbox/security posture and no additional network surface.
- Success criteria (end-to-end demo): on the index page, as a user types a sparse prompt, one contextual tip appears; when the prompt gains covered details, the tip updates to the next missing high-value item; behavior remains smooth and local with zero network calls.
- Non-goals: implementing a full AI copilot, persistence/history of tips across sessions, multilingual tip generation, or model-based inference in this iteration.
- Security constraints and sandbox model: unchanged from current architecture—no additional tool permissions, no secrets exposure, no external browsing/network requirements for tip generation.

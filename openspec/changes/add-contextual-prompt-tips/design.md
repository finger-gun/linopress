## Context

This change adds in-composer writing assistance on the frontend index experience so users get one contextual tip at a time while drafting prompts. Current UI already has a client-side prompt textarea in `app/src/app/components/PromptComposer.tsx` with no backend dependency for typing interactions. The desired behavior is seamless, local, and adaptive to the text already written.

Constraints:
- Keep guidance generation fully local (no network calls).
- Preserve current MVP interaction model and visual language.
- Avoid disruptive UX (tip thrashing, noisy updates, overwhelming users).
- Keep implementation maintainable and deterministic in a Next.js + TypeScript frontend.

Stakeholders:
- Product/design: wants better first-input quality without adding friction.
- Frontend engineering: needs an incremental, testable, low-risk implementation.

## Goals / Non-Goals

**Goals:**
- Show exactly one contextual tip at a time while the user types.
- Adapt tip content based on what is already present in the prompt.
- Keep all computation local to the browser with deterministic behavior.
- Integrate into existing prompt composer without introducing backend contracts.
- Provide stability guards (debounce, repeat suppression, confidence threshold).

**Non-Goals:**
- No model-hosted/remote hint generation.
- No persistent user profile or cross-session tip personalization.
- No full writing assistant/copilot scope (rewrite, autocomplete, multi-tip panels).
- No changes to build orchestration, runtime isolation, or export behavior.

## Decisions

1. **Use a deterministic slot-coverage analyzer with weighted scoring**
   - Decision: model prompt completeness as slots (business type, audience, goals, visual style, key sections, CTA) and score missing slots to choose the highest-value next tip.
   - Rationale: deterministic, transparent, fast, and easy to tune without network dependency.
   - Alternative considered: tiny local ML classifier. Rejected for first iteration due to bundle/perf/debug complexity.

2. **Keep tip logic in a pure utility module with UI wiring in PromptComposer**
   - Decision: place analysis/scoring in a side-effect-free utility (e.g., route-local lib/helper) and call it from composer input flow.
   - Rationale: improves testability and keeps component rendering concerns separate from analysis logic.
   - Alternative considered: inline logic directly in component. Rejected to reduce coupling and long-term maintenance cost.

3. **Single-tip presenter with anti-thrashing policy**
   - Decision: emit one active tip only; update on debounced input; hold current tip unless a clearly higher-priority gap is detected; suppress recently shown tips.
   - Rationale: preserves seamlessness and avoids visual noise while typing.
   - Alternative considered: immediate recalculation every keystroke with always-new tip. Rejected due to jitter and cognitive load.

4. **No changes to submission/network behavior**
   - Decision: guidance is read-only assistance layer; submit path and existing transient loading UX remain unchanged.
   - Rationale: aligns with current scope and avoids accidental backend coupling.

5. **Capability alignment via frontend-index-mvp-ui modification + new capability spec**
   - Decision: capture this as a new capability (`contextual-prompt-tips`) and a modified requirement set under `frontend-index-mvp-ui`.
   - Rationale: keeps spec boundaries explicit and traceable for future expansion.

6. **Component diagram (text)**

```text
IndexPage (app/src/app/page.tsx)
└─ IndexHero
   ├─ BrandLogo
   ├─ HeroCta
   └─ PromptComposer
      ├─ PromptTextarea
      ├─ ContextualTipPresenter (new)
      └─ PromptActions
```

7. **Data models (SiteSpec, BuildReport)**
   - `SiteSpec`: unchanged. Tip analysis is ephemeral frontend UX and does not alter persisted generation schema.
   - `BuildReport`: unchanged. No effect on build/verify/self-heal report contracts.

8. **Tool allowlists and URL allowlists**
   - Tool allowlists: unchanged. No new runtime tools required.
   - URL allowlist behavior: unchanged. Tip generation does not navigate or call external URLs.

9. **Self-healing loop and fallback policies**
   - Self-healing loop: unchanged platform behavior (bounded repair cycles) because this is frontend UI logic only.
   - Fallback policy: if analyzer confidence is below threshold or prompt is empty, show a stable default onboarding tip; if parsing fails, fail silent to default tip rather than blocking typing.

## Risks / Trade-offs

- **[Risk] Tip quality may feel generic for edge-case prompts** → **Mitigation:** tune weighted slots and maintain curated tip copy with context variants.
- **[Risk] Tip changes could feel jumpy during rapid typing** → **Mitigation:** debounce updates and minimum display duration before replacement.
- **[Risk] Rule drift as prompt patterns evolve** → **Mitigation:** centralize rules in tested utility and version adjustments through spec/tasks.
- **[Trade-off] Deterministic rules over ML nuance** → **Mitigation:** design analyzer interface to allow future pluggable strategy if needed.

## Migration Plan

1. Add a local analyzer utility for slot extraction and tip scoring.
2. Add a tip presenter element to prompt composer and wire debounced evaluation on input.
3. Add UX guards (repeat suppression, confidence threshold, minimum dwell time).
4. Validate behavior in dev UI:
   - empty prompt shows onboarding/default tip,
   - sparse prompt shows one high-value missing detail tip,
   - adding detail rotates to next relevant tip,
   - no network activity is triggered by tip updates.
5. Rollback strategy: revert affected frontend files under `app/src/app/components/` and any local utility module; no data migration required.

## Open Questions

- Should dismissed tips be suppressed only for current session or until textarea reset?
- What is the preferred minimum dwell time before tip replacement (e.g., 1.5s vs 3s)?
- Do we want optional “why this tip?” microcopy in MVP or defer for later UX iteration?

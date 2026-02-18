## Context

The change introduces an MVP index page UI in the frontend app (`./app`) that visually aligns with the existing marketing landing page and provides a usable prompt input field. Current state has landing-page visual primitives available in static assets/styles, while the Next.js app index route still reflects scaffold/default UI behavior.

Constraints:
- Scope is intentionally minimal and UI-only.
- No backend/API integration is allowed in this iteration.
- Existing visual language from the landing page must be reused rather than reinvented.
- Keep implementation compatible with current Next.js app-router structure.

Stakeholders:
- Product/design direction: wants a first coherent baseline for future iterative work.
- Frontend engineering: needs a simple, maintainable structure that can later connect to workflows.

## Goals / Non-Goals

**Goals:**
- Deliver a first-pass index page design with the same aesthetic foundations as the landing page (background treatment, typography, color usage).
- Render a centered, prominent prompt window pattern that is interactive for typing text.
- Display the logo in a top-left header region and keep concise CTA guidance in the main content above the prompt box.
- Keep implementation small, local, and easy to extend.

**Non-Goals:**
- No prompt submission pipeline, validation workflow, or backend calls.
- No additional UI modules (history, sidebars, multi-step flows, settings).
- No changes to agent runtime/tooling/sandbox permissions.

## Decisions

1. **Implement in existing app route with local component structure**
   - Decision: update `app/src/app/page.tsx` and corresponding styles in `app/src/app/page.module.css` (plus selective reuse of global tokens if needed).
   - Rationale: lowest-risk path, preserves app-router conventions, and keeps feature localized.
   - Alternative considered: creating a new route/component tree first. Rejected for MVP because it adds structural overhead without user value.

2. **Reuse landing-page visual primitives, not full static layout**
   - Decision: port/reuse aesthetic primitives (fonts, colors, gradients/background, spacing rhythms) instead of copying complete landing markup.
   - Rationale: keeps visual consistency while respecting different page purpose (single focused prompt input).
   - Alternative considered: full CSS import from `landingpage/styles.css`. Rejected due to excessive unused styles and coupling to marketing layout assumptions.

3. **Use semantic form controls for the prompt input area**
   - Decision: represent the fake prompt window as a styled form container with native input/textarea element.
   - Rationale: accessibility and immediate interactivity with minimal logic; allows future enhancement for submission.
   - Alternative considered: contenteditable div. Rejected because of poorer accessibility and higher complexity.

4. **No network side effects in MVP**
   - Decision: typing is local state/DOM only; no fetch/action handlers to external systems.
   - Rationale: aligns with requested scope and avoids premature backend contract decisions.

5. **Submit interaction uses transient local loading animation**
   - Decision: clicking the submit control triggers a short-lived local loading state that animates motion in the existing gradient treatment.
   - Rationale: improves perceived responsiveness and interaction polish while preserving strict UI-only MVP scope.
   - Alternative considered: static pressed-state only. Rejected because it provides weaker interaction feedback and less visual continuity with the established gradient identity.

6. **Action-button hover feedback keeps layout position stable**
   - Decision: attachment and submit controls keep a fixed position on hover (no translate/offset movement), while still allowing color/shadow emphasis.
   - Rationale: avoids distracting motion and preserves a more stable interaction target during pointer movement.

7. **Refactor index UI into reusable route-local components**
   - Decision: extract key index UI elements into reusable React components under `app/src/app/components/` and compose them from `app/src/app/page.tsx`.
   - Rationale: reduces page-level JSX complexity, improves maintainability, and makes hero/composer elements reusable for future route-level expansion.
   - Alternative considered: keep all JSX in `page.tsx` and only reuse CSS classes. Rejected because it increases coupling and makes future iteration harder.

8. **Component diagram (text)**

```text
IndexPage (app/src/app/page.tsx)
└─ IndexHero
   ├─ BrandLogo
   ├─ HeroCta
   └─ PromptComposer
      └─ PromptActions
         ├─ AttachmentButton
         └─ SubmitButton
```

9. **Data models (current and future alignment note)**
   - `SiteSpec`: unchanged by this change; no new fields required because UI does not submit structured generation input yet.
   - `BuildReport`: unchanged; this UI-only modification does not alter build pipeline/report schema.

10. **Tool allowlists and URL allowlists**
   - Tool allowlists: unchanged. Change only affects frontend source files under repository workspace.
   - URL allowlist behavior: unchanged. No external navigation or browser policy changes are introduced.

11. **Self-healing loop and fallback policies**
    - Self-healing loop: unchanged for platform behavior (max bounded repair cycles as defined by system).
    - Fallback policies: not triggered/extended by this UI change; existing platform fallback behavior (including theme/path fallbacks) remains intact.

12. **Prompt textarea autosizing within line bounds**
    - Decision: implement client-side textarea autosizing that recalculates height from content and constrains effective height between configurable minimum and maximum line counts.
    - Rationale: preserves the integrated composer appearance while improving typing ergonomics for short and long prompts.
    - Defaults: `minLines = 1` and `maxLines = 10` when not explicitly provided.
    - Behavior at max: once content height reaches the max-line cap, textarea uses internal vertical scrolling for overflow.

13. **Top bar separates branding/navigation from main composition**
    - Decision: introduce a dedicated top bar with the logo anchored at the top-left and a simple navigation slot, separated from main content by a translucent 1px divider.
    - Rationale: prepares future primary navigation while keeping the prompt experience focused and visually structured.
    - Scope note: top navigation remains minimal/placeholder in MVP and introduces no backend behavior.
    - Visual treatment: use the shared cyan→violet→pink gradient for the 1px divider to preserve brand continuity.

14. **BrandLogo supports ratio-preserving explicit sizing**
    - Decision: update `BrandLogo` to accept optional `width` and `height` props and derive the missing dimension from the default logo aspect ratio when only one prop is provided.
    - Rationale: enables predictable reuse across header/nav contexts while preventing distortion.
    - Defaults: retain the existing default logo dimensions when neither prop is provided.

15. **Component-scoped styling ownership**
    - Decision: move component-specific CSS classes out of `page.module.css` into co-located CSS modules under `app/src/app/components/`.
    - Rationale: keeps styling concerns aligned with component boundaries, simplifies maintenance, and reduces cross-component coupling.
    - Scope rule: keep only page-level structural/layout primitives in `page.module.css`; place component-owned styles beside the corresponding component.

## Risks / Trade-offs

- **[Risk] Partial visual drift from landing page despite reuse intent** → **Mitigation:** explicitly map reused tokens/values and validate side-by-side during implementation.
- **[Risk] Over-reliance on route-local CSS may hinder later sharing** → **Mitigation:** keep naming and token usage compatible with future extraction to shared style primitives.
- **[Risk] Prompt window appears interactive but non-submitting may confuse users** → **Mitigation:** keep CTA copy neutral and avoid implying backend execution.
- **[Trade-off] MVP speed over design-system formalization** → **Mitigation:** document reused primitives so later refactor can consolidate into shared styles.

## Migration Plan

1. Update index page markup/components in `app/src/app/page.tsx`.
2. Update/add focused styles in `app/src/app/page.module.css` and minimal global token reuse in `app/src/app/globals.css` if necessary.
3. Run frontend app and verify:
   - logo appears in top-left top bar and CTA remains in main content,
   - top bar is separated from main area by a translucent 1px divider,
   - prompt field is centered and typeable,
   - submit click shows a transient moving-gradient loading animation,
   - no network/backend dependency is introduced.
4. Rollback strategy: revert changed files in `app/src/app/` to previous state (no data migration required).

## Open Questions

- Should the prompt control be a single-line input or a multiline textarea for future generation prompts?
- Which exact logo variant should be used in dark/light contexts for best contrast on inherited background?
- Do we want placeholder text to match landing-page copy exactly or use app-specific wording at this stage?

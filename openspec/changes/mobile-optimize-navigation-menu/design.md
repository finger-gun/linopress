## Context

This change targets the frontend app navigation experience on small viewports. The current top navigation is optimized for desktop inline links and can become cramped when horizontal space is constrained. The project already uses React + CSS modules in `app/src/app/components/`, so the implementation should remain local to existing UI components and avoid introducing new dependencies.

Constraints:
- Keep desktop navigation behavior intact.
- Add a mobile breakpoint behavior with accessible toggle interactions.
- Preserve deterministic behavior and avoid runtime/network side effects.

Stakeholders:
- End users on mobile devices (primary)
- Product/design stakeholders expecting polished transitions
- Frontend maintainers who need low-complexity, testable behavior

Text component diagram:

```text
Page
└── TopBar
    ├── BrandLogo
    ├── NavToggleButton (mobile only)
    └── NavContainer
        └── NavLinks[]
```

Data models (project-level references):
- `SiteSpec`: unchanged by this change (no prompt/build contract updates).
- `BuildReport`: unchanged by this change (no new build-stage validation fields required).

## Goals / Non-Goals

**Goals:**
- Provide responsive navigation that switches to a hamburger toggle below a defined breakpoint.
- Animate both toggle icon state and menu panel visibility with smooth open/close transitions.
- Ensure accessibility semantics (`button`, `aria-expanded`, `aria-controls`) and keyboard operability.
- Close the mobile menu on navigation selection to avoid stale open state.

**Non-Goals:**
- Reworking information architecture or nav item set.
- Introducing server-side APIs, persistence, or analytics.
- Changing desktop layout/spacing beyond responsive rules required for coexistence.
- Adding external UI/animation libraries.

## Decisions

1) Implement stateful mobile menu behavior in the top navigation component.
- Decision: Add local React state (e.g., `isMenuOpen`) in the navigation component.
- Rationale: State is UI-local and ephemeral; colocating in component keeps behavior explicit and simple.
- Alternative considered: CSS-only checkbox hack. Rejected due to weaker accessibility semantics and harder state syncing on link click.

2) Use CSS transitions for menu panel reveal/hide and icon morphing.
- Decision: Animate opacity + transform + visibility for the panel, and rotate/translate pseudo-elements (or spans) for hamburger-to-close icon transition.
- Rationale: Native CSS transitions are lightweight, dependency-free, and align with current styling architecture.
- Alternative considered: JS animation library. Rejected as unnecessary overhead for this interaction.

3) Breakpoint strategy based on available inline nav space.
- Decision: Introduce a fixed breakpoint (e.g., around tablet/mobile threshold) in component CSS module where inline menu becomes toggle-based.
- Rationale: Deterministic and easy to maintain; avoids runtime measurement complexity.
- Alternative considered: container-query + measured overflow logic. Rejected for added complexity relative to current needs.

4) Accessibility and interaction policy.
- Decision: Use a semantic `button` toggle with `aria-expanded`/`aria-controls`; ensure focus-visible styles; hide mobile panel from pointer interaction when closed.
- Rationale: Meets baseline accessibility and predictable keyboard behavior.
- Alternative considered: clickable `div` icon. Rejected due to semantic/accessibility deficits.

5) Tool allowlists and URL allowlists for this change.
- Decision: No changes to tool allowlists or browser URL allowlists.
- Rationale: This is a local frontend/UI behavior update only.
- Current allowlist stance: unchanged from project baseline (local app operations and local URL verification only).

6) Self-healing loop and fallback policy.
- Decision: No change to platform self-healing loop contract; for UI behavior fallback, if animation classes fail, menu remains functionally toggleable without motion.
- Rationale: Preserve robustness while avoiding broken navigation due to styling edge cases.
- Fallback note: no blank→parent fallback policy changes needed for this frontend-only work.

Migration and rollout plan:
- Implement in existing top bar component + CSS module.
- Validate in dev server at desktop and mobile widths.
- Smoke-check keyboard navigation and toggle behavior.
- Rollback: revert component/CSS changes if regressions appear.

Open questions:
- Final breakpoint exact value should align with brand/layout expectations.
- Preferred animation duration/easing may require quick design tuning after first visual pass.

## Risks / Trade-offs

- [Risk] Animation causes layout jank on low-end devices → Mitigation: animate transform/opacity only; avoid expensive properties.
- [Risk] Menu state remains open during viewport resize transitions → Mitigation: add defensive close-on-link-click and optionally reset state when crossing breakpoint.
- [Risk] Accessibility regressions (focus trap/confusion) → Mitigation: keep DOM order simple, semantic button controls, and manual keyboard smoke test.
- [Trade-off] Fixed breakpoint may not perfectly match all content lengths → Mitigation: choose conservative breakpoint and revisit with container queries if needed later.

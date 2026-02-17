## Context

The existing marketing landing page displays one static prompt example in the hero area. This limits how well the page communicates the variety of valid inputs users can give Linopress. The requested change introduces a rotating prompt example treatment, scoped to front-end behavior in the landing page implementation (`landingpage/index.html` + associated styles/script).

Constraints:
- Keep behavior deterministic and static-source based (no API fetches, no randomness required for correctness).
- Preserve readability/accessibility and avoid visually disruptive motion.
- Maintain current architecture (lightweight static landing page assets) without adding heavy dependencies.

Stakeholders:
- Product/marketing: wants stronger first-impression messaging and broader use-case signaling.
- Engineering: wants low-complexity, maintainable client-side implementation.

## Goals / Non-Goals

**Goals:**
- Rotate through multiple curated example prompts in the landing page hero prompt UI.
- Provide a smooth, predictable transition cadence with legible text at all times.
- Keep implementation dependency-free and deterministic.
- Ensure basic accessibility considerations (reduced motion respect, non-jarring timing, semantic markup retained).

**Non-Goals:**
- Personalization, analytics-driven prompt selection, or remote content management.
- Introducing new backend endpoints, CMS fields, or runtime services.
- Expanding beyond the landing page prompt example component.

## Decisions

1. Store example prompts in a fixed in-page JavaScript array.
   - Rationale: deterministic behavior, easy review/versioning, zero network dependence.
   - Alternative considered: fetch prompts from JSON file/service; rejected due to added failure modes and unnecessary complexity.

2. Use timer-driven index rotation with CSS transition classes for fade/slide polish.
   - Rationale: keeps logic simple while allowing a polished visual transition.
   - Alternative considered: CSS-only keyframe text swapping; rejected because managing variable-length content and synchronization is less maintainable.

3. Respect reduced-motion preferences by disabling/softening transitions and potentially pausing auto-rotation when `prefers-reduced-motion: reduce` is detected.
   - Rationale: improves accessibility and avoids motion discomfort.
   - Alternative considered: same animation for all users; rejected due to accessibility concerns.

4. Keep fallback content visible in HTML before JS hydration.
   - Rationale: no blank state if scripts fail; preserves graceful degradation.
   - Alternative considered: JS-only rendered content; rejected because it risks empty hero copy on script failure.

## Risks / Trade-offs

- [Risk] Rotation interval too fast can reduce comprehension → Mitigation: use conservative default interval (e.g., 3–5 seconds) and short transition duration.
- [Risk] Variable prompt lengths may cause layout shift → Mitigation: constrain container dimensions or typography behavior to stabilize vertical rhythm.
- [Risk] Motion effects may impact accessibility → Mitigation: honor `prefers-reduced-motion` and provide minimal/no animation mode.
- [Trade-off] Static prompt list requires code change for updates → Mitigation: keep list centralized and clearly documented in the script block/module.

## Migration Plan

- Implement rotating prompt examples in landing page files (`index.html`, `styles.css`, optional inline/module script).
- Validate locally in browser for cadence, readability, and reduced-motion behavior.
- If issues are found, rollback by restoring static single prompt text while preserving existing markup/styles.

## Open Questions

- Final curated list size and exact prompt copy to ship (recommended 5–8 examples).
- Whether to pause rotation on hover/focus for additional readability support.
- Preferred transition style (fade only vs. subtle slide+fade) per brand tone.

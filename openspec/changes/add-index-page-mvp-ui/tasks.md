## 1. Structure and visual foundation reuse

- [x] 1.1 Map and port required landing-page visual primitives (background treatment, typography, base colors) into the app styling layer without importing the full landing-page stylesheet.
- [x] 1.2 Prepare/update index-page layout container in `app/src/app/page.tsx` and route-local styles in `app/src/app/page.module.css` for vertically stacked logo, CTA, and prompt window.

## 2. MVP index page UI implementation

- [x] 2.1 Add logo render and CTA text above the prompt window on the index page with accessible semantics.
- [x] 2.2 Implement a centered prompt window with a native, focusable text-entry control (input/textarea) that visibly accepts typing.
- [x] 2.3 Ensure prompt interaction remains UI-only by avoiding network calls, backend actions, or any extra non-requested UI modules.

## 3. Verification and polish

- [x] 3.1 Run local frontend checks to confirm the page compiles and renders with the inherited aesthetic and required hierarchy.
- [x] 3.2 Manually verify acceptance behaviors: logo + CTA above prompt, centered and prominent prompt field, typeable interaction, and no backend-triggered behavior.
- [x] 3.3 Keep scope constrained to requested MVP basics; remove any accidental extras before marking implementation complete.
- [x] 3.4 Update CTA copy to communicate value proposition and keep gradient emphasis on selected buzzwords in the app hero.
- [x] 3.5 Refine prompt composer so textarea is fully integrated in prompt body and action row includes both attachment and submit controls.
- [x] 3.6 Update prompt action controls to icon-based circular buttons (`+` attachment, arrow submit) with gradient emphasis on submit and solid styling on attachment.
- [x] 3.7 Add local submit-button loading feedback with animated gradient motion on click while keeping interaction UI-only (no backend/network call).
- [x] 3.8 Remove hover position shift from prompt action buttons while retaining non-positional visual hover feedback.
- [x] 3.9 Add prompt textarea autosizing that grows with content between configurable min/max line bounds (defaults: min 1, max 10).
- [x] 3.10 Add subtle upper and lower decorative glow accents to the prompt window, aligned with landing-page prompt styling.

## 4. Reusable component refactor

- [x] 4.1 Extract relevant index-page UI elements into reusable route-local components and compose them from `app/src/app/page.tsx` without changing MVP behavior.

## 5. Top bar layout refinement

- [x] 5.1 Move brand logo into a dedicated top bar aligned to the top-left of the viewport and keep main CTA/prompt composition in the primary content region.
- [x] 5.2 Add a simple top navigation slot in the header and separate top bar from main content using a translucent 1px divider.

## 6. Brand logo sizing API refinement

- [x] 6.1 Extend `app/src/app/components/BrandLogo.tsx` to accept optional `width` and `height` props and preserve aspect ratio when only one dimension is supplied.

## 7. Header divider visual refinement

- [x] 7.1 Update the top-bar bottom divider to use the shared brand gradient while preserving a translucent 1px separation effect.

## 8. Component style co-location and instruction hardening

- [ ] 8.1 Move component-specific styles from `app/src/app/page.module.css` into co-located component CSS modules and wire imports in each component.
- [ ] 8.2 Keep only page-level layout/structural styles in `app/src/app/page.module.css` after redistribution.
- [ ] 8.3 Add general agent instructions in `AGENT.md` requiring component-first UI composition where applicable and co-located component styling by default.

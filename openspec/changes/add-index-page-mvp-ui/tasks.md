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

## Why

The current top navigation does not gracefully adapt to narrow viewports, causing links to crowd or overflow and reducing usability on mobile devices. Addressing this now improves first-use experience on phones and aligns the UI with responsive expectations for modern web apps.

## What Changes

- Add responsive navigation behavior that switches from inline desktop links to a mobile toggle pattern when viewport width is below a defined breakpoint.
- Introduce an animated hamburger control that transitions between closed/open visual states.
- Add animated menu panel reveal/hide behavior for mobile navigation with smooth enter/exit transitions.
- Ensure keyboard and assistive-technology support for menu toggle interaction (button semantics, `aria-expanded`, focus handling).
- Define explicit non-goals: no redesign of information architecture, no new routes, and no changes to desktop navigation layout beyond responsive breakpoints.
- Define end-to-end success criteria: from initial page load on mobile viewport, user opens menu, sees animated transition, activates a navigation item, and menu closes predictably without layout breakage.
- Preserve security and sandbox constraints: this change is frontend-only in the app workspace and does not expand tool or runtime permissions.

## Capabilities

### New Capabilities
- `responsive-mobile-navigation`: Provide a viewport-aware navigation system with a hamburger toggle and animated show/hide behavior for small screens.

### Modified Capabilities
- None.

## Impact

- Affected code: top bar/navigation React component(s), navigation CSS modules, and potentially page-level layout wrappers in the frontend app.
- APIs: no backend/API contract changes.
- Dependencies: no new runtime dependencies required; use existing React/CSS capabilities.
- Systems: UX behavior on mobile viewports improves; desktop behavior remains functionally equivalent.

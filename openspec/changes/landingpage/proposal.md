## Why

Linopress needs the landing page to communicate a web-based prompting experience, not a CLI product. The current terminal-like hero framing can mislead visitors about the core interaction model, so we need to shift the visual metaphor to a prompt composer surface while preserving the existing “coming soon” message.

## What Changes

- Add a temporary, static marketing landing page focused on “coming soon” messaging for Linopress.
- Implement the page using plain HTML and CSS (no frontend framework) for speed, portability, and minimal maintenance.
- Include core sections: hero/value proposition, key upcoming capabilities, trust/safety positioning, and a clear call to action for interest/signup.
- Replace terminal-window primary visuals with a web-native prompt UI metaphor (prompt field/page/window styling) that still feels technical and premium.
- Establish visual direction that is modern and eye-catching while remaining simple to iterate.
- Define explicit non-goals for this change:
  - No full product UI or dashboard implementation.
  - No WordPress site-generation workflow changes.
  - No payment, account system, or backend feature development.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `marketing-landing-page`: Refine visual and copy requirements so the hero communicates a web-based prompting workflow (not terminal-first interaction), while preserving guardrail and trust messaging.

## Impact

- Affected code/systems:
  - New static landing-page assets and structure in the repository (HTML/CSS, optional static assets).
  - Updates to hero/mockup layout and CTA framing to align with browser-based prompting behavior.
  - Potentially small updates to docs/readme or local run instructions for previewing the landing page.
- APIs/dependencies:
  - No new backend APIs.
  - No new frontend framework dependency expected.
- Security and sandbox model constraints:
  - Page must remain static and not introduce unrestricted browser navigation or shell behavior.
  - Any verification continues to respect Linopress isolation and allowlist guardrails.
- End-to-end success criteria (demo scenario):
  - From a clean checkout, run the standard local preview flow and open the landing page.
  - The page loads without build errors, presents the intended sections and messaging, and renders a modern visual style on desktop and mobile.
  - The page clearly states what Linopress brings to market, why it is trustworthy (deterministic + isolated + verified), and how users can express interest.

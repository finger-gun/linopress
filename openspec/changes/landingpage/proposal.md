## Why

Linopress needs a temporary public landing page that clearly communicates its upcoming value proposition while the full product is still in development. Shipping this now creates early awareness, lets us validate messaging, and gives potential users a concrete destination to understand what is coming.

## What Changes

- Add a temporary, static marketing landing page focused on “coming soon” messaging for Linopress.
- Implement the page using plain HTML and CSS (no frontend framework) for speed, portability, and minimal maintenance.
- Include core sections: hero/value proposition, key upcoming capabilities, trust/safety positioning, and a clear call to action for interest/signup.
- Establish visual direction that is modern and eye-catching while remaining simple to iterate.
- Define explicit non-goals for this change:
  - No full product UI or dashboard implementation.
  - No WordPress site-generation workflow changes.
  - No payment, account system, or backend feature development.

## Capabilities

### New Capabilities
- `marketing-landing-page`: Deliver a temporary, static Linopress landing page with modern styling, informative content, and hype-building messaging.

### Modified Capabilities
- None.

## Impact

- Affected code/systems:
  - New static landing-page assets and structure in the repository (HTML/CSS, optional static assets).
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

## Context

Linopress needs a temporary, high-impact landing page to communicate upcoming product value before the full platform launch. The current repo has templates and agent/runtime systems, but no dedicated “coming soon” marketing surface tailored for audience acquisition and messaging validation.

This change intentionally stays lightweight (plain HTML/CSS) and should integrate cleanly with current repository structure without introducing frontend build complexity. The page content must highlight Linopress market promise (prompt → build → verify → self-heal → export), while keeping implementation and maintenance low friction. Recent product-direction feedback requires that the hero visual no longer read as a terminal product; it must instead signal a web-based prompt composer experience.

## Goals / Non-Goals

**Goals:**
- Ship a modern, visually compelling, static landing page using HTML and CSS only.
- Provide clear, informative sections: hero, core value proposition, upcoming capabilities, trust/guardrails, and call to action.
- Ensure the primary visual metaphor represents browser-based prompting (prompt field/page/window) rather than terminal execution.
- Ensure responsive behavior across common viewport sizes.
- Keep implementation easy to preview and modify by contributors.
- Preserve Linopress product guardrails in messaging (deterministic execution, allowlisted tools, isolation, verification-first).

**Non-Goals:**
- Building production app UX flows (auth/dashboard/workspace).
- Adding JS-heavy interactivity, framework runtime, or SPA architecture.
- Implementing backend signup pipelines or CRM integrations.
- Modifying core runtime orchestration, tool implementations, or container isolation behavior.
- Building a functioning in-browser editor product surface; this is still a marketing mockup only.

## Decisions

1. **Static implementation with plain HTML + CSS**
   - **Decision:** Implement as static files with semantic HTML sections and modular CSS blocks.
   - **Why:** Fastest path to deployable result; no build tool overhead; simple contribution surface.
   - **Alternatives considered:**
     - React/Vite page: rejected due to unnecessary dependency/runtime complexity for temporary marketing goal.
     - CMS-driven page: rejected due to slower setup and coupling to runtime logic not required for MVP hype page.

2. **Repository placement and structure**
   - **Decision:** Place artifacts in an isolated landing-page area (e.g., `landingpage/` or equivalent static path) with clear file boundaries (`index.html`, `styles.css`, optional assets).
   - **Why:** Keeps marketing surface decoupled from agent runtime and OpenSpec source artifacts.
   - **Alternatives considered:**
     - Embedding directly into docs markdown: rejected; insufficient design control and visual impact.
     - Injecting into WordPress templates immediately: rejected for this temporary phase; increases coupling.

3. **Design language and content hierarchy**
   - **Decision:** Use a "Dark Mode" first aesthetic with high-tech visual cues, but shift hero framing from terminal chrome to web-app prompt composer chrome.
     - **Backgrounds:** Deep blacks (`#0a0a0a`) or dark grays (`#111`) to reduce eye strain and pop content.
     - **Accents:** Vibrant neon gradients (Purple/Cyan/Blue) for buttons, borders, and key text highlights, inspired by modern AI/Web3 product landing pages.
     - **Typography:** Clean, modern sans-serif (e.g., Inter or system fonts) with large, bold headings and readable body text.
      - **Components:** Glassmorphism effects (translucent backgrounds with blur) for cards and sticky headers; hero mockup uses browser-like frame, prompt textarea/input, and action controls.
   - **Why:** Aligns with the "AI/Automation" nature of Linopress while accurately signaling that interaction happens through a web interface, reducing product-positioning confusion.
   - **Alternatives considered:**
     - Light mode / Corporate style: rejected; feels too traditional and less "cutting edge" for an AI agent tool.
     - Minimal plain text style: rejected; insufficient marketing impact.
     - Highly animated experience: rejected; introduces complexity and accessibility risk.

4. **Accessibility and performance baseline**
   - **Decision:** Prioritize semantic landmarks, readable contrast, scalable typography, and optimized static assets.
   - **Why:** Ensures broad usability and fast load, especially important for first impression pages.
   - **Alternatives considered:**
     - Visual-first without semantic/accessibility checks: rejected due to reduced inclusiveness and quality.

5. **Security/guardrail-aligned messaging**
   - **Decision:** Explicitly communicate sandbox/isolation and allowlist constraints as product trust signals; do not add external scripts by default.
   - **Why:** Reinforces Linopress differentiation and avoids introducing avoidable security surface.
   - **Alternatives considered:**
      - Embedding third-party trackers/widgets initially: deferred; not needed for first launch page iteration.

6. **Hero interaction mock strategy**
   - **Decision:** Represent prompting as a static “compose + generate” UI panel (e.g., textarea with sample prompt and non-functional primary button), replacing terminal command-line motifs.
   - **Why:** Preserves a technical aesthetic while matching intended product mental model (web-based prompt-to-site flow).
   - **Alternatives considered:**
     - Keep terminal shell look and tweak text only: rejected; visual impression still implies CLI-first product.
     - Full interactive demo widget: rejected for this change due to scope and maintenance overhead.

### Component Diagram (text)

- `LandingPage (HTML)`
  - `HeroSection`
    - `PromptComposerMock`
  - `ValuePropsSection`
  - `HowItWorksSection`
  - `TrustAndSafetySection`
  - `CTASection`
  - `Footer`
- `Stylesheet (CSS)`
  - `DesignTokens` (colors, spacing, typography scale)
  - `LayoutPrimitives` (container/grid/flex utilities)
  - `SectionStyles`
  - `ResponsiveRules`
- `StaticAssets`
  - `Logo`
  - optional decorative gradients/images

### Data Models (contextual to Linopress messaging)

Although this change is static, page copy and trust sections reference existing product models:

- `SiteSpec` (referenced conceptually in messaging)
  - Represents desired site intent/configuration used by Linopress build flow.
- `BuildReport` (referenced conceptually in messaging)
  - Represents deterministic build/verification outcome with bounded self-healing results.

No schema changes are introduced in this landing-page change.

### Tool allowlists and URL allowlists

- **Tool allowlists:** No new runtime tool allowlist entries required. This change only adds static content files.
- **URL allowlists:** Landing page itself should avoid external navigation requirements by default. Any CTA links should prefer internal/project-owned URLs.

### Self-healing and fallback policy impact

- No new self-healing loop logic is added for landing page delivery.
- Existing platform policy remains unchanged (bounded repair attempts <=2 cycles for build flows).
- No blank→parent theme fallback behavior is modified by this change.

## Risks / Trade-offs

- **[Risk] Marketing copy drifts from actual near-term product capabilities** → **Mitigation:** Keep capability statements aligned with current OpenSpec specs and review during release.
- **[Risk] “Eye-catching” design hurts readability/accessibility** → **Mitigation:** Enforce contrast and spacing checks; prefer restrained accents over heavy visual noise.
- **[Risk] Temporary page becomes long-lived and stale** → **Mitigation:** Add clear ownership and lightweight update checklist in tasks.
- **[Trade-off] No JS analytics initially** → **Mitigation:** Accept reduced behavioral insights in exchange for speed/simplicity/security; add later if needed.

## Migration Plan

1. Add static landing page files and assets in designated location.
2. Validate local rendering and responsive behavior.
3. Confirm copy aligns with proposal and current specs.
4. Ship as temporary default marketing page entry point.

Rollback strategy:
- Revert the landing-page directory/files to return to previous repo state; no data migration required.

## Open Questions

- Should CTA direct users to a simple waitlist form now or remain an informational “coming soon” action only?
- Should the temporary page become the repository’s default preview entry point, or remain a standalone path?
- Is bilingual content needed for first release, or English-only initially?

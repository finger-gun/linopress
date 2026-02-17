## ADDED Requirements

### Requirement: Landing page hero uses a web-based prompt UI metaphor
The landing page hero SHALL present Linopress as a browser-based prompting experience by using a prompt composer visual (field/page/window style) instead of terminal-first UI chrome.

#### Scenario: Hero visual aligns with product interaction model
- **WHEN** a user views the hero section
- **THEN** the primary mock interface reads as a web prompt composer and does not look like a command-line terminal

### Requirement: Temporary marketing landing page exists
The system SHALL provide a temporary Linopress marketing landing page that is publicly viewable and communicates that the product is coming soon.

#### Scenario: Landing page can be opened
- **WHEN** a user opens the landing page route or file in a browser
- **THEN** the page renders successfully with no required backend dependency

### Requirement: Landing page uses plain HTML and CSS only
The landing page implementation MUST use standard HTML and CSS without requiring a frontend framework runtime.

#### Scenario: Source implementation remains framework-free
- **WHEN** the landing page source files are reviewed
- **THEN** they contain static HTML/CSS artifacts and no framework bootstrap requirement

### Requirement: Landing page delivers core product messaging
The page SHALL include informative content that explains Linopress value for the market, including prompt-to-site workflow, deterministic execution, verification, and portability.

#### Scenario: Core value proposition is visible
- **WHEN** a user reads the main content sections
- **THEN** they can identify what Linopress is, who it is for, and what outcomes it promises

### Requirement: Landing page visual design is clean, simple, and powerful
The page SHALL use a Linear/Vercel-inspired aesthetic with bold typography, electric teal accents, and smooth, restrained animations that support readability and perceived quality.

#### Scenario: Visual hierarchy supports first impression
- **WHEN** a user loads the page on desktop viewport
- **THEN** the hero, supporting sections, and CTAs are visually distinct, easy to scan, and consistent with a clean, high-contrast style

### Requirement: Landing page includes required section flow
The page SHALL include the following sections in a clear narrative order: hero with primary CTA, feature cards, how-it-works flow, and a final CTA section.

#### Scenario: Required sections are present and ordered
- **WHEN** a user scrolls the page from top to bottom
- **THEN** they encounter hero with CTA, feature cards, how-it-works, and final CTA in a coherent sequence

### Requirement: Landing page is responsive across common viewport sizes
The page MUST remain usable and readable on mobile and desktop widths using responsive layout rules.

#### Scenario: Mobile layout remains readable
- **WHEN** the page is viewed on a narrow viewport
- **THEN** content stacks appropriately and text/buttons remain legible without horizontal overflow

### Requirement: Landing page includes clear call to action
The page SHALL include prominent calls to action in both the hero and final CTA section to guide users to the next step.

#### Scenario: Calls to action are discoverable
- **WHEN** a user scans the page from top to bottom
- **THEN** they encounter a clear primary CTA in the hero and a reinforcing CTA near the end of the page

### Requirement: Landing page messaging reflects security and sandbox constraints
The page MUST avoid implying unrestricted execution and SHALL align trust messaging with Linopress guardrails (allowlisted tools, isolated runtime, verification-first approach).

#### Scenario: Trust claims remain guardrail-aligned
- **WHEN** a reviewer checks trust and safety copy
- **THEN** claims remain consistent with documented platform constraints and do not overstate capabilities

## ADDED Requirements

### Requirement: Index page reuses landing-page visual language
The frontend app index page SHALL reuse the established landing-page aesthetic primitives, including background styling, typography family, and core color palette, so the app experience is visually consistent with the existing landing page.

#### Scenario: Index page inherits core aesthetic primitives
- **WHEN** a user opens the frontend app index route
- **THEN** the rendered page uses background, typeface, and color treatments aligned with the existing landing page style system

### Requirement: Index page presents a centered, typeable prompt field
The index page MUST display a prominent prompt window centered in the main viewport area, and the prompt control inside it SHALL accept user keyboard input as a functional text-entry field.

#### Scenario: User can type into prompt field
- **WHEN** a user focuses the prompt control and enters text
- **THEN** the typed characters are visible in the prompt field without requiring backend connectivity

### Requirement: Logo and CTA appear above prompt window
The index page SHALL render the product logo and a concise call-to-action above the prompt window in a vertically ordered hierarchy to guide first interaction.

#### Scenario: Hierarchy is visible on initial load
- **WHEN** the index page finishes initial render
- **THEN** the logo and CTA are visible above the prompt window before any user interaction

### Requirement: MVP scope remains UI-only with no backend behavior
The prompt interaction on the index page MUST remain a UI-only MVP behavior and SHALL NOT trigger backend/API requests, generation workflows, or additional feature modules not explicitly included in this change.

#### Scenario: Typing does not invoke backend requests
- **WHEN** a user types into the prompt control
- **THEN** no backend request is initiated and no extra non-requested feature surfaces are rendered

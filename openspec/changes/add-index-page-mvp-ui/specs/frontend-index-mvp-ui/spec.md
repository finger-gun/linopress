## ADDED Requirements

### Requirement: Index page UI uses reusable component composition
The index page SHALL compose relevant UI elements as reusable React components so the MVP interface can be extended and reused without duplicating markup or behavior.

#### Scenario: Hero and prompt areas are composed from reusable components
- **WHEN** a developer inspects the index page implementation
- **THEN** the page composes reusable components for the key hero/prompt UI elements (logo, CTA content, prompt composer shell, and action controls)
- **AND** component boundaries preserve current visual behavior and accessibility semantics
- **AND** no backend behavior is introduced as part of this componentization

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

#### Scenario: CTA communicates value and prompt intent
- **WHEN** a user reads the hero copy on initial load
- **THEN** the CTA includes value-oriented text about turning words into a fully featured WordPress site
- **AND** emphasized buzzwords use the shared gradient text treatment aligned with landing-page styling
- **AND** supporting copy instructs the user to describe their site to get started

### Requirement: Prompt composer feels integrated and includes core actions
The prompt window SHALL present the textarea as an integrated part of the composer body and provide an action row beneath it with both attachment and submit controls.

#### Scenario: Textarea fills the prompt composer body
- **WHEN** the prompt panel is rendered
- **THEN** the textarea visually blends with the prompt body container
- **AND** the textarea spans the full available width and primary height of the input region

#### Scenario: Action row includes attachments and submit controls
- **WHEN** a user inspects the prompt action area below the textarea
- **THEN** an attachment button is visible
- **AND** a submit prompt button is visible
- **AND** both controls use icon-first presentation in the MVP (`+` for attachment and arrow for submit) with accessible labels
- **AND** both controls render as circular buttons, with submit visually emphasized using the shared gradient treatment and attachment using a solid style
- **AND** hover feedback MUST NOT shift button position relative to layout (no translate/motion offset)
- **AND** both controls remain UI-only elements with no backend-triggered behavior in this MVP

### Requirement: MVP scope remains UI-only with no backend behavior
The prompt interaction on the index page MUST remain a UI-only MVP behavior and SHALL NOT trigger backend/API requests, generation workflows, or additional feature modules not explicitly included in this change.

#### Scenario: Typing does not invoke backend requests
- **WHEN** a user types into the prompt control
- **THEN** no backend request is initiated and no extra non-requested feature surfaces are rendered

## MODIFIED Requirements

### Requirement: Prompt composer feels integrated and includes core actions
The prompt window SHALL present the textarea as an integrated part of the composer body and provide an action row beneath it with both attachment and submit controls. The submit control SHALL provide local visual loading feedback on click using motion in the shared gradient treatment.

#### Scenario: Action row includes attachments and submit controls
- **WHEN** a user inspects the prompt action area below the textarea
- **THEN** an attachment button is visible
- **AND** a submit prompt button is visible
- **AND** both controls use icon-first presentation in the MVP (`+` for attachment and arrow for submit) with accessible labels
- **AND** both controls render as circular buttons, with submit visually emphasized using the shared gradient treatment and attachment using a solid style
- **AND** both controls remain UI-only elements with no backend-triggered behavior in this MVP

#### Scenario: Submit control shows local loading animation feedback
- **WHEN** a user clicks the submit prompt button
- **THEN** the submit control enters a transient loading state with animated gradient motion feedback
- **AND** the loading state exits automatically after a short duration without backend requests
- **AND** the control remains keyboard-focusable with accessible naming preserved

#### Scenario: Prompt textarea auto-resizes within configurable line bounds
- **WHEN** a user types multiline content in the prompt textarea
- **THEN** the textarea automatically grows to fit content height while the rendered line count remains between configured minimum and maximum line bounds
- **AND** default behavior uses a minimum of 1 line and a maximum of 10 lines when bounds are not explicitly configured
- **AND** once the maximum line bound is reached, additional content is accommodated via internal textarea scrolling

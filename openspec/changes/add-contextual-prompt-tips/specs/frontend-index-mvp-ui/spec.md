## MODIFIED Requirements

### Requirement: Prompt composer feels integrated and includes core actions
The prompt window SHALL present the textarea as an integrated part of the composer body and provide an action row beneath it with both attachment and submit controls. The submit control SHALL provide local visual loading feedback on click using motion in the shared gradient treatment. The composer SHALL also present one contextual writing tip at a time that adapts to prompt content without introducing backend-triggered behavior.

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

#### Scenario: Composer shows one contextual tip while writing
- **WHEN** a user types in the prompt textarea
- **THEN** exactly one contextual tip is rendered within the composer
- **AND** the tip content reflects the most important missing brief detail inferred from current prompt text
- **AND** tip generation remains local and does not trigger backend requests

#### Scenario: Tip updates remain stable during rapid typing
- **WHEN** a user types quickly or edits text repeatedly
- **THEN** tip updates are debounced and do not flicker on every keystroke
- **AND** the composer avoids immediately repeating the same tip text when alternatives are available

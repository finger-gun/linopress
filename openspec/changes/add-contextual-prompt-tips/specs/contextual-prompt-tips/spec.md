## ADDED Requirements

### Requirement: Composer SHALL provide one contextual tip at a time
The system SHALL display exactly one active guidance tip associated with the prompt composer while the user is writing, and the tip SHALL reflect the highest-priority missing brief detail inferred from the current prompt text.

#### Scenario: Sparse prompt shows a single high-value tip
- **WHEN** a user enters a prompt that omits key planning details
- **THEN** exactly one contextual tip is shown
- **AND** the tip asks for the highest-priority missing detail category

#### Scenario: Covered detail advances to next missing category
- **WHEN** a user updates the prompt to include the detail requested by the current tip
- **THEN** the active tip updates to the next highest-priority missing category
- **AND** no second simultaneous tip is shown

### Requirement: Tip analysis SHALL run fully client-side with deterministic behavior
The system SHALL compute contextual tip selection in the frontend runtime without backend/API calls, using deterministic rules that map prompt signals to missing-detail categories.

#### Scenario: Typing updates do not trigger network hint requests
- **WHEN** a user types, deletes, or edits text in the prompt composer
- **THEN** tip recomputation occurs locally in the browser
- **AND** no network request is made for tip generation

#### Scenario: Same input yields same tip outcome
- **WHEN** equivalent prompt text is analyzed multiple times within the same rule version
- **THEN** the same active tip category and copy variant are selected each time

### Requirement: Tip presentation SHALL remain stable and non-disruptive
The system SHALL apply stability controls for tip updates, including debounced recomputation, minimum confidence threshold, and immediate repeat suppression, so guidance does not flicker or thrash during typing.

#### Scenario: Rapid keystrokes do not cause per-keystroke tip flicker
- **WHEN** a user types rapidly in the prompt textarea
- **THEN** tip updates are emitted after a debounce interval rather than every keystroke

#### Scenario: Low-confidence analysis falls back to default guidance
- **WHEN** analyzer confidence is below the configured minimum threshold
- **THEN** a stable default onboarding tip is shown
- **AND** typing remains uninterrupted

#### Scenario: Recently shown tip is not immediately repeated
- **WHEN** a higher-priority alternative tip is available after a recent tip display
- **THEN** the composer prefers the alternative tip over immediately re-showing the same tip text

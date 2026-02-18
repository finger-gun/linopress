# Spec: frontend-prompt-composer

## ADDED Requirements

### Requirement: Prompt textarea input
The system SHALL provide a large, accessible textarea for users to describe their WordPress site in natural language.

#### Scenario: User enters site description
- **WHEN** user types in the prompt textarea
- **THEN** system SHALL validate input length (minimum 20 characters, maximum 2000 characters)

#### Scenario: Empty prompt submission
- **WHEN** user attempts to submit without text
- **THEN** system SHALL disable the generate button and show validation message

### Requirement: Style seed selection
The system SHALL allow users to select one of three predefined style seeds: bold, elegant, or minimalist.

#### Scenario: User selects style seed
- **WHEN** user clicks a style seed button
- **THEN** system SHALL highlight the selected seed and store selection for build

#### Scenario: Default style seed
- **WHEN** user does not select a style seed
- **THEN** system SHALL default to "elegant"

### Requirement: Advanced options expansion
The system SHALL provide collapsible advanced options for plugin selection, language, and timezone configuration.

#### Scenario: User expands advanced options
- **WHEN** user clicks "Advanced options" toggle
- **THEN** system SHALL reveal plugin checkboxes, language dropdown, and timezone selector

#### Scenario: Plugin selection
- **WHEN** user checks plugin checkboxes in advanced options
- **THEN** system SHALL include selected plugins in build request

### Requirement: Build request submission
The system SHALL submit build requests to the API when user clicks "Generate site" button.

#### Scenario: Valid prompt submission
- **WHEN** user clicks "Generate site" with valid prompt
- **THEN** system SHALL POST to `/api/builds/create` and redirect to build progress page

#### Scenario: Server error handling
- **WHEN** API returns error status
- **THEN** system SHALL display error message without navigation

### Requirement: Visual fidelity to landing page
The prompt composer SHALL match the landing page's dark editorial aesthetic including electric animated border, grain texture, and CSS custom properties.

#### Scenario: Electric border animation
- **WHEN** prompt panel is displayed
- **THEN** system SHALL render animated gradient border with 7-second cycle

#### Scenario: Responsive layout
- **WHEN** viewed on mobile devices (< 768px width)
- **THEN** system SHALL adjust layout to single column with full-width prompt panel
